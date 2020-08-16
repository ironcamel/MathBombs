package MathSheets::Routes::API;
use Dancer ':syntax';

use Dancer::Plugin::DBIC qw(rset);
use Dancer::Plugin::Email;
use Dancer::Plugin::Passphrase;
use Dancer::Plugin::Res;
use DateTime;
use Email::Valid;
use Proc::Simple::Async;

use MathSheets::MathSkills qw(available_skills gen_problems sample_problem);
use MathSheets::Util qw(gen_uuid irand past_sheets);

hook before => sub {
    return if var 'auth_token';

    my $is_api = request->path_info =~ m{^/api};
    my $is_public_api =
        request->path_info =~ m{^/api/auth-tokens}
        || request->path_info =~ m{^/api/password-reset-tokens}
        || request->is_post && request->path_info eq '/api/teachers';

    if ($is_api and not $is_public_api) {
        my $token = request->header('x-auth-token');
        my $auth_token = rset('AuthToken')->find({
            token      => $token,
            is_deleted => 0,
        });
        var auth_token => $auth_token;
        if (not $auth_token) {
            status 403;
            halt { error => 'Invalid x-auth-token header.' };
        }
    }
};

post '/api/auth-tokens' => sub {
    my $email = param 'email'
        or return res 403 => { error => 'Email is required' };
    my $password = param 'password'
        or return res 403 => { error => 'Password is required' };
    if ($email eq config->{admin_email}
            and $password eq config->{admin_password}) {
        session teacher => $email;
        return redirect uri_for '/admin';
    }
    my $teacher = rset('Teacher')->find({ email => $email })
        or return res 403 => { error => 'No such email exists in the system' };
    return res 403 => { error => 'Invalid password' }
        unless passphrase($password)->matches($teacher->pw_hash);
    session teacher => $email;
    my $token = passphrase->generate_random({
        length  => 64,
        charset => ['a'..'z', 0 .. 9],
    });
    my $auth_token = _create_auth_token($teacher);
    return { data => $auth_token };
};

post '/api/password-reset-tokens' => sub {
    my $email = param 'email';
    my $teacher = rset('Teacher')->find({ email => $email });
    if (not $teacher) {
        return res 400 => {
            error => "No such account found for that email",
        };
    }
    eval {
        my $token = $teacher->password_reset_tokens->create({
            id => gen_uuid(),
        });
        my $body = template password_reset_email => { token => $token->id },
            { layout => undef };
        email {
            to      => $email,
            subject => 'MathBombs password',
            body    => $body,
        };
    };
    if ($@) {
        return res 500 => { error => $@ };
    }
    return {
      msg => "found email: $email",
    };
};

post '/api/password-reset-tokens/:token_id' => sub {
    my $password = param 'password'
        or return res 400 => { error => 'password is required' };
    my $token = rset('PasswordResetToken')->find(param 'token_id');
    return res 404 => { error => "Token does not exist or is expired"}
        if !$token or $token->is_deleted;
    my $teacher = $token->teacher;
    my $pw_hash = passphrase($password)->generate . '';
    debug "setting pw_hash: [$pw_hash]";
    $teacher->update({ pw_hash => $pw_hash });
    $token->update({ is_deleted => 1 });
    return res 200 => { msg => "done" };
};

post '/api/teachers' => sub {
    # TODO: I really should use a validation framework to do all this
    my $name = param 'name';
    if  (!$name or $name !~ /^\w[\w\s\.]*\w$/) {
        return res 400 => { error => 'Name is invalid' };
    }
    my $email = param 'email';
    if (not $email) {
        return res 400 => { error => 'Email is required' };
    }
    if (not Email::Valid->address($email)) {
        return res 400 => { error => 'Email is invalid' };
    }
    my $password = param 'password';
    if (not $password) {
        return res 400 => { error => 'Password is required' };
    }
    if (length($password) < 4) {
        return res 400 => {
            error => 'The password must be at least 4 characters long'
        };
    }
    my $teacher = eval {
        rset('Teacher')->create({
            id      => gen_uuid(),
            name    => $name,
            email   => $email,
            pw_hash => passphrase($password)->generate . '',
        });
    };
    if ($@) {
        if ($@ =~ /UNIQUE constraint failed/i) {
            return res 400 => {
                error => "The email address $email already exists"
            };
        } else {
            error $@;
            return res 400 => {
                error => "There was an error creating your account."
                    . " Please contact the admin or try again later."
                    . " ERROR: $@"
            };
        }
    }
    my $auth_token = _create_auth_token($teacher);
    session teacher => $email;
    return res 201 => {
        data => $teacher,
        meta => {
            auth_token => $auth_token->token,
        }
    };
};

patch '/api/teachers/:teacher_id' => sub {
    my $teacher_id = param 'teacher_id';
    my $teacher = _teacher();
    return res 403 => { error => "Not allowed to update this teacher." }
        unless $teacher_id eq $teacher->id;
    my $rewards_email = param 'rewards_email'
        or return res 400 => {error => 'The rewards_email param is required.'};
    $teacher->update({ rewards_email => $rewards_email });
    return { data => $teacher };
};

get '/api/students' => sub {
    my @students = sort { $a->name cmp $b->name } _teacher()->students->all;
    return { data => \@students };
};

post '/api/students' => sub {
    my $name = param 'name'
        or return res 400 => { error => 'The name param is required.' };
    return res 400 => { error => "Invalid name" }
        if $name !~ /^\w[\w\s\.]*\w$/;
    my $teacher = _teacher();
    return res 400 => { error => "Student $name already exists"}
        if $teacher->students->count({ name => $name });
    info "Adding student $name";
    my $student = $teacher->students->create({
        id                 => gen_uuid(),
        name               => $name,
        math_skill         => 'Addition',
        password           => irand(1000) + 100,
        problems_per_sheet => 6,
    });
    return res 201 => { data => $student };
};

get '/api/students/:student_id' => sub {
    my $student_id = param 'student_id';
    my $student = _teacher()->students->find({ id => $student_id })
        or return res 404 => { error => "No such student." };
    return { data => $student };
};

patch '/api/students/:student_id' => sub {
    my $student_id = param 'student_id';
    my $student = _teacher()->students->find({ id => $student_id })
        or return res 404 => { error => "No such student." };
    my $password = param 'password';
    my $cols = {};
    if ($password) {
        return res 400 => { error => "Invalid password" }
            unless $password =~ /^\w[\w\s\.]*\w$/;
        $cols->{password} = $password;
    }

    my $math_skill = param 'math_skill';
    if ($math_skill) {
        return res 400 => { error => "Invalid math_skill" }
            unless grep { $math_skill eq $_ }
            map { $_->type } @{ available_skills() };
        $cols->{math_skill} = $math_skill;
    }

    my $pps = param 'problems_per_sheet';
    $cols->{problems_per_sheet} = int($pps) if $pps;

    if (my $difficulty = param 'difficulty') {
        return res 400 => { error => "Invalid difficulty" }
            unless grep { $_ eq $difficulty } 1..3;
        $cols->{difficulty} = int($difficulty) if $difficulty;
    }

    if (%$cols) {
        $student->update($cols);
    }
    return { data => $student };
};

del '/api/students/:student_id' => sub {
    my $auth_token = var 'auth_token';
    my $student_id = param 'student_id'
        or return res 400 => { error => 'The student_id param is required.' };
    my $student = _teacher()->students->find($student_id)
        or return res 400 => { error => 'No such student.' };
    info "Deleting student " . $student->name . " $student_id";
    $student->delete;
    return {};
};

post '/api/students/:student_id/sample-problem' => sub {
    my $student_id = param 'student_id';
    my $student = _teacher()->students->find({ id => $student_id })
        or return res 404 => { error => "No such student." };
    return { data => sample_problem($student) };
};

get '/api/skills' => sub {
    return { data => available_skills() };
};

get '/api/rewards' => sub {
    my $student_id = param 'student_id'
        or return res 400 => { error => 'The student_id param is required.' };
    my $student = _teacher()->students->find($student_id)
        or return res 400 => { error => 'No such student.' };
    my @rewards = $student->rewards->all;
    return { data => \@rewards };
};

post '/api/rewards' => sub {
    my $student_id = param 'student_id'
        or return res 400 => { error => 'The student_id param is required.' };
    my $sheet_id = param 'sheet_id'
        or return res 400 => { error => 'The sheet_id param is required.' };
    my $reward_msg = param 'reward'
        or return res 400 => { error => 'The reward param is required.' };
    my $student = _teacher()->students->find($student_id)
        or return res 400 => { error => 'No such student.' };
    my $reward = $student->rewards->update_or_create({
        id       => gen_uuid(),
        sheet_id => $sheet_id,
        reward   => $reward_msg,
    });
    return { data => $reward };
};

del '/api/rewards/:reward_id' => sub {
    my $reward_id = param 'reward_id';
    my $student_id = param 'student_id'
        or return res 400 => { error => 'The student_id param is required.' };
    my $student = _teacher()->students->find($student_id)
        or return res 400 => { error => 'No such student.' };
    my $reward = $student->rewards->find($reward_id)
        or return res 404 => { error => 'No such reward.' };
    $reward->delete;
    return {};
};

get '/api/powerups' => sub {
    my $student_id = param 'student_id'
        or return res 400 => { error => 'The student_id param is required.' };
    my $student = _teacher()->students->find($student_id)
        or return res 400 => { error => 'No such student.' };
    my @powerups = $student->powerups->all;
    return { data => \@powerups };
};

patch '/api/powerups' => sub {
    my $student_id = param 'student_id'
        or return res 400 => { error => 'The student_id param is required.' };
    my $powerup_id = param 'powerup_id';
    return res 400 => { error => 'The powerup_id param is required.' }
        unless defined $powerup_id;
    my $cnt = param 'cnt';
    return res 400 => { error => 'The cnt (count) param is required.' }
        unless defined $cnt;
    return res 400 => { error => 'The powerups count must be an integer.' }
        unless $cnt =~ /^\d+$/;
    my $student = _teacher()->students->find($student_id)
        or return res 400 => { error => 'No such student.' };
    my $powerup = $student->powerups->find({
        id         => $powerup_id,
        student_id => $student_id,
    }) or return res 404 => { error => 'No such powerup.' };
    $powerup->update({ cnt => int($cnt) });
    return { data => $powerup };

};

post '/api/problems' => sub {
    my $student_id = param 'student_id'
        or return res 400 => { error => 'The student_id param is required.' };
    my $sheet_id = param 'sheet_id'
        or return res 400 => { error => 'The sheet_id param is required.' };
    my $student = _teacher()->students->find($student_id)
        or return res 400 => { error => 'No such student.' };
    my $problems;
    if (my $sheet = $student->sheets->find({ id => $sheet_id })) {
        debug "Grabbing problems from db for sheet $sheet_id";
        $problems = [ $sheet->problems->all ];
    } else {
        debug "Creating new problems for sheet $sheet_id";
        $problems = gen_problems($student);
        my $sheet = $student->sheets->create({
            id         => $sheet_id,
            math_skill => $student->math_skill,
            difficulty => $student->difficulty,
        });
        for my $p (@$problems) {
            $sheet->problems->create($p);
        }
    }
    return { data => $problems };
};

patch '/api/problems/:pid' => sub {
    my $pid = param 'pid';
    my $guess = param 'guess';
    return res 400 => { error => 'The guess param is required.' }
        unless defined $guess;
    my $student_id = param 'student_id'
        or return res 400 => { error => 'The student_id param is required.' };
    my $sheet_id = param 'sheet_id'
        or return res 400 => { error => 'The sheet_id param is required.' };
    my $student = _teacher()->students->find($student_id)
        or return res 400 => { error => 'No such student.' };
    my $problem = rset('Problem')->find({
        id      => $pid,
        sheet   => $sheet_id,
        student => $student_id,
    }) or return res 404 => { error => 'No such problem exists.' };
    $problem->update({ guess => $guess });
    my $reward_msg = process_sheet($problem->sheet);
    return {
        data => $problem,
        meta => { reward => $reward_msg },
    };
};

sub process_sheet {
    my ($sheet) = @_;
    return if $sheet->finished; # This sheet has already been completed

    my $num_correct = $sheet->problems->count({ answer => { -ident => 'guess' } });
    my $num_problems = $sheet->problems->count;
    return if $num_correct != $num_problems;

    my $sheet_id = $sheet->id;

    $sheet->update({ finished => DateTime->now->ymd });
    my $student = $sheet->student;
    $student->update({ last_sheet => $sheet_id })
        if $sheet_id > $student->last_sheet; # sanity check
    send_progress_email(student => $student, sheet_id => $sheet_id);
    my $reward = $student->rewards->single({ sheet_id => $sheet_id });

    if (not $reward) {
        my @rewards = $student->rewards({
            sheet_id => undef,
            is_given => 0,
        });
        for my $r (@rewards) {
            if ($r->week_goal and past_week() >= $r->week_goal) {
                $reward = $r;
            } elsif ($r->month_goal and past_month() >= $r->month_goal) {
                $reward = $r;
            }
            last if $reward;
        }
    }

    my $msg = '';
    if ($reward) {
        $msg = $reward->reward;
        send_special_msg_email(
            student  => $student,
            sheet_id => $sheet_id,
            msg      => $msg,
        );
        $reward->update({ is_given => 1 });
    }

    return $msg;
};

sub send_progress_email {
    my %args = @_;
    my $student = $args{student};
    my $sheet_id = $args{sheet_id};
    my $student_id = $student->id;
    my $name = $student->name;
    my $past_week = past_week();
    my $past_month = past_month();
    my $subject = "MathBombs: $name completed sheet $sheet_id"
        . " ($past_week/7 $past_month/30)";
    my $body = template progress_email => {
        name       => $name,
        sheet_id   => $sheet_id,
        past_week  => $past_week,
        past_month => $past_month,
        sheet_url  => uri_for("/students/$student_id/sheets/$sheet_id"),
    }, { layout => undef };
    my $to = $student->teacher->email;
    async { send_email(to => $to, subject => $subject, body => $body) };
};

sub send_special_msg_email {
    my %args = @_;
    my $student = $args{student};
    my $sheet_id = $args{sheet_id};
    my $msg = $args{msg};
    my $student_id = $student->id;
    my $name = $student->name;
    my $subject = "MathBombs: special message for $name from sheet #$sheet_id";
    my $body = template special_msg_email => {
        name     => $name,
        sheet_id => $sheet_id,
        msg      => $msg,
    }, { layout => undef };
    my $to = $student->teacher->email;
    async { send_email(to => $to, subject => $subject, body => $body) };
    my $rewards_email = $student->teacher->rewards_email;
    return unless $rewards_email;
    async { 
        send_email(to => $rewards_email, subject => $subject, body => $body)
    };
}

sub send_email {
    my %args = @_;
    my $from = config->{plugins}{Email}{headers}{from};
    $args{from} = $from ? $from : 'noreply@mathbombs.org';
    eval {
        email \%args;
        debug "Sent email $args{subject}";
    };
    error "Could not send email: $@" if $@;
}

sub past_week  { past_sheets(7 ) }
sub past_month { past_sheets(30) }

sub _teacher {
    my $auth_token = var 'auth_token' or return;
    return $auth_token->teacher;
}

sub _create_auth_token {
    my ($teacher) = @_;
    my $token = passphrase->generate_random({
        length  => 64,
        charset => ['a'..'z', 0 .. 9],
    });
    return $teacher->auth_tokens->create({
        id    => gen_uuid(),
        token => $token,
    });
}

1;
