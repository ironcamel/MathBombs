package MathSheets::Routes::Teachers;
use Dancer ':syntax';

use Dancer::Plugin::DBIC qw(rset schema);
use Dancer::Plugin::Passphrase;
use Dancer::Plugin::Res;
use Email::Valid;

use MathSheets::MathSkills qw(available_skills gen_problems);
use MathSheets::Util qw(past_sheets gen_uuid get_powerups irand);

# Confirm that a teacher is logged in before allowing access to any sensitive
# /teacher/* routes.
#
hook before => sub {
    if (!session('teacher') and request->path_info =~ m{^/teacher}) {
        session login_err => 'You must be logged in to access teacher pages';
        return redirect uri_for '/login';
    }
};

# Displays the teacher profile page
get '/teacher/profile' => sub { template 'teacher' };

# List of students page
get '/teacher/students' => sub { template 'students' };

# Displays portal page for the teacher's students
get '/portals/:teacher_id' => sub { template 'portal' };

get '/teacher/students2/:student_id' => sub {
    return template student2 => {
        student_id => param('student_id'),
    };
};

# Settings page for a student
get '/teacher/students/:student_id' => sub {
    template student => {
        student_id => param('student_id'),
    };
};

sub get_teacher {
    my ($email) = @_;
    $email ||= session 'teacher';
    return schema->resultset('Teacher')->find({ email => $email });
}

1;
