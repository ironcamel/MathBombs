package MathSheets::Routes::API;
use Dancer ':syntax';

use Dancer::Plugin::DBIC qw(rset);
use Dancer::Plugin::Email;
use Dancer::Plugin::Passphrase;
use Dancer::Plugin::Res;
use Email::Valid;
use MathSheets::Util qw(gen_uuid);

post '/api/login' => sub {
    my $email = param 'email'
        or return res 403 => { err => 'Email is required' };
    my $password = param 'password'
        or return res 403 => { err => 'Password is required' };
    if ($email eq config->{admin_email}
            and $password eq config->{admin_password}) {
        session teacher => $email;
        return redirect uri_for '/admin';
    }
    my $teacher = get_teacher($email)
        or return res 403 => { err => 'No such email exists in the system' };
    return res 403 => { err => 'Invalid password' }
        unless passphrase($password)->matches($teacher->pw_hash);
    session teacher => $email;
    return res 200 => {};
};

post '/api/teachers' => sub {
    # TODO: I really should use a validation framework to do all this
    my $name = param 'name';
    if  (!$name or $name !~ /^\w[\w\s\.]*\w$/) {
        return res 400 => { err => 'Name is invalid' };
    }
    my $email = param 'email';
    if (not $email) {
        return res 400 => { err => 'Email is required' };
    }
    if (not Email::Valid->address($email)) {
        return res 400 => { err => 'Email is invalid' };
    }
    my $password = param 'password';
    if (not $password) {
        return res 400 => { err => 'Password is required' };
    }
    if (length($password) < 4) {
        return res 400 => {
            err => 'The password must be at least 4 characters long'
        };
    }
    my $teacher = eval {
        rset('Teacher')->create({
            id      => gen_uuid(),
            name    => $name,
            email   => $email,
            pw_hash => passphrase($password)->generate_hash . '',
        });
    };
    if ($@) {
        if ($@ =~ /UNIQUE constraint failed/i) {
            return res 400 => {
                err => "The email address $email already exists"
            };
        } else {
            error $@;
            return res 400 => {
                err => "There was an error creating your account."
                    . " Please contact the admin or try again later."
                    . " ERROR: $@"
            };
        }
    }
    session teacher => $email;
    return res 201 => {};
};

post '/api/password-reset-tokens' => sub {
    my $email = param 'email';
    my $teacher = rset('Teacher')->find({ email => $email });
    if (not $teacher) {
        return res 400 => {
            err => "No such account found for that email",
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
        return res 500 => { err => $@ };
    }
    return {
      msg => "found email: $email",
    };
};

post '/api/password-reset-tokens/:token_id' => sub {
    my $password = param 'password'
        or return res 400 => { err => 'password is required' };
    my $token = rset('PasswordResetToken')->find(param 'token_id');
    return res 404 => { err => "Token does not exist or is expired"}
        if !$token or $token->is_deleted;
    my $teacher = $token->teacher;
    my $pw_hash = passphrase($password)->generate . '';
    debug "setting pw_hash: [$pw_hash]";
    $teacher->update({ pw_hash => $pw_hash });
    $token->update({ is_deleted => 1 });
    return res 200 => { msg => "done" };
};

sub get_teacher {
    my ($email) = @_;
    $email ||= session 'teacher';
    return rset('Teacher')->find({ email => $email });
}

1;
