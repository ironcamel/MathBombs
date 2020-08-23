package MathSheets::Routes;
use Dancer ':syntax';
use Dancer::Plugin::DBIC qw(rset);

my $app = sub { template 'app', {}, { layout => undef } };

get '/' => $app;
get '/help' => $app;
get '/login' => $app;
get '/portals/:teacher_id' => $app;
get '/teacher/students' => $app;
get '/teacher/students/:student_id' => $app;
get '/teacher/profile' => $app;
get '/forgot-password' => sub { template 'forgot_password' };
get '/password-reset' => sub { template 'password_reset' };

get '/logout' => sub {
    my $email = session 'teacher';
    if ($email) {
        my ($teacher) = rset('Teacher')->search(\[ 'lower(email) = ?', lc $email ]);
        $teacher->auth_tokens->delete if $teacher;
    }
    session teacher => undef;
    return redirect uri_for '/login';
};

1;
