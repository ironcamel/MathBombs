package MathSheets::Routes::Auth;
use Dancer ':syntax';

get '/login' => sub { template 'login' };

get '/logout' => sub {
    session teacher => undef;
    return redirect uri_for '/login';
};

get '/forgot-password' => sub { template 'forgot_password' };

get '/password-reset' => sub { template 'password_reset' };

1;
