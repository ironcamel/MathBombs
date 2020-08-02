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
    if (!session('teacher')
            and request->path_info =~ m{^/teacher}
            and request->path_info !~ m{^/teacher/new}) {
        session login_err => 'You must be logged in to access teacher pages';
        return redirect uri_for '/login';
    }
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

# Update settings for a student
#
post '/teacher/students/:student_id' => sub {
    my $teacher = get_teacher();
    my $student_id = param 'student_id';
    my $difficulty = param 'difficulty';
    my $math_skill = param 'math_skill';
    my $count      = param 'count';
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
        id       => gen_uuid(),
        sheet_id => $sheet_id,
        reward   => $reward,
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

sub get_teacher {
    my ($email) = @_;
    $email ||= session 'teacher';
    return schema->resultset('Teacher')->find({ email => $email });
}

1;
