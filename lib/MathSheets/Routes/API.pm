package MathSheets::Routes::API;
use Dancer ':syntax';

use Dancer::Plugin::DBIC qw(rset);
use Dancer::Plugin::Email;
use Dancer::Plugin::Passphrase;
use Dancer::Plugin::Res;
use Email::Valid;
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
