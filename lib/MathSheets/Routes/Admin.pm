package MathSheets::Routes::Admin;
use Dancer ':syntax';

use Dancer::Plugin::DBIC qw(rset);
use Dancer::Plugin::Res;

get '/admin' => sub {
    return res 403, 'Forbidden'
        unless config->{admin_email} eq session 'teacher';
    template admin => {
        teachers => [ rset('Teacher')->all ],
    };
};

post '/ajax/login_as' => sub {
    return res 403, 'Forbidden'
        unless config->{admin_email} eq session 'teacher';
    my $email = param 'email';
    session teacher => $email;
    return 1;
};

1;
