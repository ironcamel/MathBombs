package MathSheets::Teacher;
use Dancer ':syntax';

use v5.10;
use Dancer::Plugin::DBIC qw(schema);
use Dancer::Plugin::Passphrase;
use Data::UUID;
use Email::Valid;

use MathSheets::Util qw(past_sheets);

# Handles requests for the root of the application.
# If a teacher is logged in, redirect them to their list of students.
# Otherwise, redirect them to the login page.
#
get '/' => sub {
    return redirect uri_for '/teacher/students' if session 'teacher';
    return redirect uri_for '/login';
};

# Retrieves the login page.
#
get '/login' => sub { login_tmpl() };

# Handles teacher logins.
#
post '/login' => sub {
    my $email = param 'email'
        or return login_tmpl('Email is required');
    my $password = param 'password'
        or return login_tmpl('Password is required');
    my $teacher = schema->resultset('Teacher')->find({ email => $email })
        or return login_tmpl('No such email exists in the system');
    return login_tmpl('Invalid password')
        unless passphrase($password)->matches($teacher->pw_hash);
    session teacher => $teacher->email;
    return redirect uri_for '/teacher/students';
};

# Handles teachers logging out.
#
get '/logout' => sub {
    session teacher => undef;
    return redirect uri_for '/login';
};

# Creates a new teacher.
#
post '/teacher/new' => sub {
    # TODO: I really should use a validation framework to do all this
    my $name = param 'new_name';
    if  (!$name or $name !~ /^\w[\w\s\.]*\w$/) {
        session login_err => 'Name is invalid';
        return redirect uri_for '/login';
    }
    my $email = param 'new_email';
    if (not $email) {
        session login_err => 'Email is required';
        return redirect uri_for '/login';
    }
    if (not Email::Valid->address($email)) {
        session login_err => 'Email is invalid';
        return redirect uri_for '/login';
    }
    my $password = param 'new_password';
    my $password2 = param 'new_password2';
    if (not $password or not $password2) {
        session login_err => 'Password is required';
        return redirect uri_for '/login';
    }
    if ($password ne $password2) {
        session login_err => 'The passwords do not match';
        return redirect uri_for '/login';
    }
    if (length($password) < 4) {
        session login_err => 'The password must be at least 4 characters long';
        return redirect uri_for '/login';
    }
    my $teacher = eval {
        schema->resultset('Teacher')->create({
            name    => $name,
            email   => $email,
            pw_hash => passphrase($password)->generate_hash . '',
        });
    };
    if ($@) {
        if ($@ =~ /column email is not unique/) {
            session login_err => "The email address $email already exists";
            return redirect uri_for '/login';
        } else {
            error $@;
            session login_err => "There was an error creating your account."
                . " Please contact the admin or try again later.";
            return redirect uri_for '/login';
        }
    }
    session teacher => $email;
    return redirect uri_for '/students';
};

# Display list of students for the given teacher
#
get '/teacher/students' => sub {
    my $email = session 'teacher';
    if (not $email) {
        session login_err => 'You must be logged in to access your students';
        return redirect uri_for '/login';
    }
    my $teacher = schema->resultset('Teacher')->find({ email => $email });
    return students_tmpl($teacher);
};

# Add a new student for the given teacher.
#
post '/teacher/students' => sub {
    my $email = session 'teacher';
    if (not $email) {
        session login_err => 'You must be logged in to add a student';
        return redirect uri_for '/login';
    }
    my $name = param 'name';
    info "Adding student $name";
    my $teacher = schema->resultset('Teacher')->find({ email => $email });
    return students_tmpl($teacher, "Invalid name")
        if  !$name or $name !~ /^\w[\w\s]*\w$/;
    return students_tmpl($teacher, "Student $name already exists")
        if $teacher->students->single({ name => $name });
    my $uuid = Data::UUID->new->create_str;
    $teacher->add_to_students({ name => $name, id => $uuid });
    return students_tmpl($teacher);
};

# Deletes a student.
#
post '/teacher/ajax/delete_student' => sub {
    my $email = session 'teacher' or return;
    my $student_id = param 'student_id';
    info "$email is deleting $student_id";
    my $teacher = schema->resultset('Teacher')->find({ email => $email });
    $teacher->students({ id => $student_id })->delete_all;
    return;
};

# Returns a login template.
# An optional error message may be provided as a param or from the session.
#
sub login_tmpl {
    my ($err) = @_;
    $err ||= session 'login_err';
    error "Login failed: $err" if $err;
    session teacher => undef;
    session login_err => undef;
    return template login => { err => $err };
}

# Returns a students list page template.
# An optional error message may be provided.
#
sub students_tmpl {
    my ($teacher, $err) = @_;
    error "Students list page error: $err" if $err;
    my @students = $teacher->students->all;
    my %progress = map
        {
            $_->id => {
                past_week  => past_sheets(7,  $_->id),
                past_month => past_sheets(30, $_->id),
            }
        } @students;
    @students = sort
        { $progress{$a->id}{past_month} <=> $progress{$b->id}{past_month} }
        @students;
    return template students => {
        err      => $err,
        students => \@students,
        progress => \%progress,
    };
}

1;
