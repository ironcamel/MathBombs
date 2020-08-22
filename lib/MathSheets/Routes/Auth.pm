package MathSheets::Routes::Auth;
use Dancer ':syntax';

use Dancer::Plugin::DBIC qw(rset);

get '/login' => sub { template 'login' };

get '/logout' => sub {
    my $email = session 'teacher';
    if ($email) {
        my ($teacher) = rset('Teacher')->search(\[ 'lower(email) = ?', lc $email ]);
        $teacher->auth_tokens->delete if $teacher;
    }
    session teacher => undef;
    return redirect uri_for '/login';
};

get '/forgot-password' => sub { template 'forgot_password' };

get '/password-reset' => sub { template 'password_reset' };

1;
