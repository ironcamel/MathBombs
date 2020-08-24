package MathSheets::Routes;
use Dancer ':syntax';
use Dancer::Plugin::DBIC qw(rset);

my @routes = qw(
    /
    /help
    /login
    /portals/:teacher_id
    /students/:student_id/sheets/:sheet_id
    /students/:student_id/report
    /teacher/students
    /teacher/students/:student_id
    /teacher/profile
    /forgot-password
    /password-reset
);

for my $route (@routes) {
    get $route => sub { template 'app', {}, { layout => undef } };
}

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
