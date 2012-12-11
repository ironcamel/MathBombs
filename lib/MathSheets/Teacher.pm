package MathSheets::Teacher;
use Dancer ':syntax';

use v5.10;
use Dancer::Plugin::DBIC qw(schema);
use Dancer::Plugin::Passphrase;
use Dancer::Plugin::Res;
use Data::UUID;
use Email::Valid;

use MathSheets::MathSkills qw(available_skills build_skill gen_problems);
use MathSheets::Util qw(past_sheets get_powerups);

hook before => sub {
    if (!session('teacher')
            and request->path_info =~ m{^/teacher}
            and request->path_info !~ m{^/teacher/new}) {
        session login_err => 'You must be logged in to access teacher pages';
        return redirect uri_for '/login';
    }
};

# Handles requests for the root of the application.
# If a teacher is logged in, redirect them to their list of students.
# Otherwise, redirect them to the login page.
#
get '/' => sub {
    return redirect uri_for '/teacher/students' if session 'teacher';
    return redirect uri_for '/login';
};

# Retrieves the login page.
#
get '/login' => sub { login_tmpl() };

# Handles teacher logins.
#
post '/login' => sub {
    my $email = param 'email'
        or return login_tmpl('Email is required');
    my $password = param 'password'
        or return login_tmpl('Password is required');
    my $teacher = get_teacher($email)
        or return login_tmpl('No such email exists in the system');
    return login_tmpl('Invalid password')
        unless passphrase($password)->matches($teacher->pw_hash);
    session teacher => $email;
    return redirect uri_for '/teacher/students';
};

# Handles teachers logging out.
#
get '/logout' => sub {
    session teacher => undef;
    return redirect uri_for '/login';
};

# Creates a new teacher.
#
post '/teacher/new' => sub {
    # TODO: I really should use a validation framework to do all this
    my $name = param 'new_name';
    if  (!$name or $name !~ /^\w[\w\s\.]*\w$/) {
        session login_err => 'Name is invalid';
        return redirect uri_for '/login';
    }
    my $email = param 'new_email';
    if (not $email) {
        session login_err => 'Email is required';
        return redirect uri_for '/login';
    }
    if (not Email::Valid->address($email)) {
        session login_err => 'Email is invalid';
        return redirect uri_for '/login';
    }
    my $password = param 'new_password';
    my $password2 = param 'new_password2';
    if (not $password or not $password2) {
        session login_err => 'Password is required';
        return redirect uri_for '/login';
    }
    if ($password ne $password2) {
        session login_err => 'The passwords do not match';
        return redirect uri_for '/login';
    }
    if (length($password) < 4) {
        session login_err => 'The password must be at least 4 characters long';
        return redirect uri_for '/login';
    }
    my $teacher = eval {
        schema->resultset('Teacher')->create({
            id      => Data::UUID->new->create_str,
            name    => $name,
            email   => $email,
            pw_hash => passphrase($password)->generate_hash . '',
        });
    };
    if ($@) {
        if ($@ =~ /column email is not unique/) {
            session login_err => "The email address $email already exists";
            return redirect uri_for '/login';
        } else {
            error $@;
            session login_err => "There was an error creating your account."
                . " Please contact the admin or try again later.";
            return redirect uri_for '/login';
        }
    }
    session teacher => $email;
    return redirect uri_for '/teacher/students';
};

# Displays the teacher profile page
get '/teacher/profile' => sub {
    my $err = session 'profile_err';
    session 'profile_err' => undef;
    template teacher => {
        teacher => get_teacher(),
        err     => $err,
    };
};

# Updates teacher profile
#
post '/teacher/profile' => sub {
    my $teacher = get_teacher();
    my $printer_email = param 'printer_email';
    if (not Email::Valid->address($printer_email)) {
        session profile_err => 'Printer email is invalid';
        return redirect uri_for '/teacher/profile';
    }
    $teacher->update({ rewards_email => $printer_email });
    return redirect uri_for '/teacher/profile';
};

# Displays the list of students for the given teacher
#
get '/teacher/students' => sub { students_tmpl() };

get '/portals/:teacher_id' => sub {
    my $teacher = schema->resultset('Teacher')->find(param 'teacher_id')
        or return res 404, 'No such portal';
    return students_tmpl(is_portal => 1, teacher => $teacher);
};

# Adds a new student for the given teacher.
#
post '/teacher/students' => sub {
    my $name = param('name') || '';
    info "Adding student $name";
    my $teacher = get_teacher();
    return students_tmpl(err => "Invalid name")
        if  !$name or $name !~ /^\w[\w\s\.]*\w$/;
    return students_tmpl(err => "Student $name already exists")
        if $teacher->students->single({ name => $name });
    my $uuid = Data::UUID->new->create_str;
    $teacher->students->create({
        id         => $uuid,
        name       => $name,
        math_skill => 'Addition',
        password   => int(rand() * 1000 + 100),
    });
    return students_tmpl();
};

# Settings page for a student
#
get '/teacher/students/:student_id' => sub {
    my $teacher = get_teacher();
    my $student = $teacher->students->find(param 'student_id')
        or return res 404, 'You have no such student';
    my $problems = gen_problems($student);
    template student => {
        student  => $student,
        skills   => available_skills(),
        problem  => $problems->[0],
        rewards  => [ $student->rewards->all ],
        powerups => get_powerups($student),
    };
};

# Update settings for a student
#
post '/teacher/students/:student_id' => sub {
    my $teacher = get_teacher();
    my $student_id = param 'student_id';
    my $difficulty = param 'difficulty';
    my $math_skill = param 'math_skill';
    my $count      = param 'count';
    debug "updating $student_id $math_skill $difficulty per_sheet: $count";
    my $student = $teacher->students->find($student_id)
        or return res 404, 'You have no such student';
    $student->update({
        difficulty         => $difficulty,
        math_skill         => $math_skill,
        problems_per_sheet => $count,
    });
    return redirect uri_for "/teacher/students/$student_id";
};

# Adds a reward for the student.
#
post '/teacher/students/:student_id/rewards' => sub {
    my $teacher    = get_teacher();
    my $student_id = param 'student_id';
    my $sheet_id   = param 'sheet_id';
    my $reward     = param 'reward';
    my $student = $teacher->students->find($student_id)
        or return res 404, 'You have no such student';
    $student->rewards->update_or_create({
        sheet_id   => $sheet_id,
        reward     => $reward,
    });
    return redirect uri_for "/teacher/students/$student_id";
};

# Updates student's power-ups.
#
post '/teacher/students/:student_id/powerups' => sub {
    my $teacher    = get_teacher();
    my $student_id = param 'student_id';
    my $pu1        = param 'pu1';
    my $pu2        = param 'pu2';
    my $student = $teacher->students->find($student_id)
        or return res 404, 'You have no such student';
    return res 400, 'Power-up counts must be integers'
        unless $pu1 =~ /^\d+$/ and $pu2 =~ /^\d+$/;
    $student->powerups->update_or_create({ id  => 1, cnt => $pu1 });
    $student->powerups->update_or_create({ id  => 2, cnt => $pu2 });
    return redirect uri_for "/teacher/students/$student_id";
};

# Deletes a student.
#
post '/teacher/ajax/delete_student' => sub {
    my $teacher = get_teacher() or return;
    my $student_id = param 'student_id';
    info $teacher->email . " is deleting $student_id";
    $teacher->students({ id => $student_id })->delete_all;
    return;
};

# Updates the password for a student.
#
post '/teacher/ajax/update_password' => sub {
    my $teacher = get_teacher() or return;
    my $student_id = param 'student_id';
    my $password = param 'password';
    return { err => "Invalid password" } unless $password =~ /^\w[\w\s\.]*\w$/;
    $teacher->students({ id => $student_id })->update(
        { password => $password });
    return;
};

# Updates the password for a student.
#
post '/teacher/ajax/delete_reward' => sub {
    my $teacher = get_teacher() or return;
    my $student_id = param 'student_id';
    my $sheet_id = param 'sheet_id';
    my $student = $teacher->students->find($student_id)
        or return { err => "No such student for this teacher" };
    $student->rewards({ sheet_id => $sheet_id })->delete_all;
    return;
};


# Returns a login template.
# An optional error message may be provided as a param or from the session.
#
sub login_tmpl {
    my ($err) = @_;
    $err ||= session 'login_err';
    error "Login failed: $err" if $err;
    session login_err => undef;
    return template login => { err => $err };
}

# Returns a students list page template.
# An optional error message may be provided.
#
sub students_tmpl {
    my (%args) = @_;
    my $err = $args{err};
    error "Students list page error: $err" if $err;
    my $teacher = $args{teacher} || get_teacher();
    my $is_portal = $args{is_portal};
    my @students = $teacher->students->all;
    my %skills = map { $_->id => build_skill($_) } @students;
    my %progress = map
        {
            $_->id => {
                past_week  => past_sheets(7,  $_->id),
                past_month => past_sheets(30, $_->id),
            }
        } @students;
    @students = sort
        { $progress{$a->id}{past_month} <=> $progress{$b->id}{past_month} }
        @students;
    return template students => {
        err       => $err,
        teacher   => $teacher,
        students  => \@students,
        progress  => \%progress,
        skills    => \%skills,
        is_portal => $is_portal,
    };
}

sub get_teacher {
    my ($email) = @_;
    $email ||= session 'teacher';
    return schema->resultset('Teacher')->find({ email => $email });
}

1;
