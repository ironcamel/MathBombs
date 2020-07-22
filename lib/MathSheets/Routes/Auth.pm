package MathSheets::Routes::Auth;
use Dancer ':syntax';

use Dancer::Plugin::DBIC qw(rset);
use Dancer::Plugin::Email;
use Dancer::Plugin::Passphrase;
use Dancer::Plugin::Res;
use MathSheets::Util qw(gen_uuid);

get '/forgot-password' => sub { template 'forgot_password' };

get '/password-reset' => sub { template 'password_reset' };

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

1;
