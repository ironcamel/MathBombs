package MathSheets::Routes::Teachers;
use Dancer ':syntax';

use Dancer::Plugin::DBIC qw(rset schema);
use Dancer::Plugin::Passphrase;
use Dancer::Plugin::Res;
use Email::Valid;

use MathSheets::MathSkills qw(available_skills build_skill gen_problems);
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
get '/teacher/students' => sub { template 'students2' };

# Displays portal page for the teacher's students
get '/portals/:teacher_id' => sub { template 'portal' };

# Settings page for a student
get '/teacher/students/:student_id' => sub {
    my $teacher = get_teacher();
    my $student = $teacher->students->find(param 'student_id')
        or return res 404, 'You have no such student';
    my $problems = gen_problems($student);
    template student => {
        student  => $student,
        skills   => available_skills(),
        problem  => $problems->[0],
        rewards  => [ $student->rewards->all ],
        powerups => get_powerups($student),
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

# Deletes a student.
#
post '/teacher/ajax/delete_student' => sub {
    my $teacher = get_teacher() or return;
    my $student_id = param 'student_id';
    info $teacher->email . " is deleting $student_id";
    $teacher->students({ id => $student_id })->delete_all;
    return;
};

# Updates the password for a student.
#
post '/teacher/ajax/update_password' => sub {
    my $teacher = get_teacher() or return;
    my $student_id = param 'student_id';
    my $password = param 'password';
    return { err => "Invalid password" } unless $password =~ /^\w[\w\s\.]*\w$/;
    $teacher->students({ id => $student_id })->update(
        { password => $password });
    return;
};

post '/teacher/ajax/delete_reward' => sub {
    my $teacher = get_teacher() or return;
    my $reward_id = param 'reward_id';
    rset('Reward')->search({ id => $reward_id })->delete;
    return;
};


# Returns a login template.
# An optional error message may be provided as a param or from the session.
#
sub login_tmpl {
    my ($err) = @_;
    $err ||= session 'login_err';
    error "Login failed: $err" if $err;
    session login_err => undef;
    return template login => { err => $err };
}

sub get_teacher {
    my ($email) = @_;
    $email ||= session 'teacher';
    return schema->resultset('Teacher')->find({ email => $email });
}

1;
