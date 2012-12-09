package MathSheets;
use Dancer ':syntax';

use v5.10;
use Dancer::Plugin::DBIC qw(schema);
use Dancer::Plugin::Email;
use Dancer::Plugin::Res;
use DateTime;

use MathSheets::MathSkills qw(gen_problems);
use MathSheets::Util qw(past_sheets);

our $VERSION = '0.0001';

#$ENV{DBIC_TRACE} = '1=/tmp/dbic_trace';

get '/students/:student_id' => sub {
    my $student_id = param 'student_id';
    my $user = schema->resultset('Student')->find($student_id)
        or return res 404, "No such user";
    my $sheet_id = $user->last_sheet + 1;
    redirect "/students/$student_id/sheets/$sheet_id";
};

get '/students/:student_id/sheets/:sheet_id' => sub {
    my $student_id = param 'student_id';
    my $sheet_id = param 'sheet_id';
    debug "Getting sheet $sheet_id for $student_id";
    my $student = schema->resultset('Student')->find($student_id);
    if ($sheet_id > $student->last_sheet + 1) {
        return res 404, "You may not skip ahead";
    }

    my $problems;
    if (my $sheet = $student->sheets->find({ id => $sheet_id })) {
        debug "Grabbing problems from db for sheet $sheet_id";
        $problems = [ $sheet->problems->all ];
    } else {
        debug "Creating new problems for sheet $sheet_id";
        $problems = gen_problems($student);
        given ($student_id) {
            when ('leila') {
                #$problems = simplification(9, 100);
                #$problems = simplification(6, 100);
            }
        }
        my $sheet = $student->sheets->create({
            id         => $sheet_id,
            math_skill => $student->math_skill,
            difficulty => $student->difficulty,
        });
        for my $p (@$problems) {
            $sheet->problems->create($p);
        }
    }
    my $powerups = {
        1 => 0,
        2 => 0,
        map { $_->id => $_->cnt } $student->powerups->all
    };
    template sheet => {
        name       => $student->name,
        student_id => $student_id,
        sheet_id   => $sheet_id,
        problems   => $problems,
        past_week  => past_week(),
        past_month => past_month(),
        powerups   => $powerups,
    };
};

post '/ajax/save_answer' => sub {
    my $student_id = param 'student_id';
    my $sheet_id   = param 'sheet_id';
    my $pid        = param 'pid';
    my $guess      = param 'guess';
    my $problem = schema->resultset('Problem')->find({
        id      => $pid,
        sheet   => $sheet_id,
        student => $student_id,
    })->update({ guess => $guess });
    return 1;
};

# Handles a student finishing a sheet
#
post '/ajax/finished_sheet' => sub {
    my $sheet_id = param 'sheet_id';
    my $student_id = param 'student_id';
    my $sheet = schema->resultset('Sheet')->find({
        id      => $sheet_id,
        student => $student_id,
    });
    return if $sheet->finished; # This sheet has already been completed

    $sheet->update({ finished => DateTime->now->ymd });
    my $student = $sheet->student;
    $student->update({ last_sheet => $sheet_id })
        if $sheet_id > $student->last_sheet; # sanity check
    send_progress_email(student => $student, sheet_id => $sheet_id);
    my $msg = config->{msgs}{$student_id}{$sheet_id};
    if ($msg) {
        send_special_msg_email(
            student  => $student,
            sheet_id => $sheet_id,
            msg      => $msg,
        );
    }
    return;
};

post '/ajax/used_powerup' => sub {
    my $student_id = param 'student_id';
    my $powerup_id = param 'powerup_id';
    my $user_powerups = schema->resultset('Powerup')->find({
        id      => $powerup_id,
        student => $student_id,
    });
    my $count = $user_powerups->cnt;
    $user_powerups->update({ cnt => --$count });
    return 1;
};

get '/students/:student_id/report' => sub {
    my $student_id = param 'student_id';
    my $user = schema->resultset('Student')->find($student_id)
        or return res 404, "No such user";
    template report => {
        student_id => $student_id,
        user_name  => $user->name || $student_id,
        past_week  => past_week(),
        past_month => past_month(),
    }
};

any '/ajax/add_powerup' => sub {
    my $student_id = param 'student_id';
    my $powerup_id = param 'powerup_id';
    return res 400, { error => 'student_id is required' } unless $student_id;
    return res 400, { error => 'powerup_id is required' } unless $powerup_id;
    my $user = schema->resultset('Student')->find($student_id)
        or return res 404, { error => 'No such user' };
    my $powerups = schema->resultset('Powerup')->find_or_create({
        id      => $powerup_id,
        student => $student_id,
    });
    my $count = $powerups->cnt;
    $powerups->update({ cnt => ++$count });
    return { powerups => $count };
};

get '/ajax/report' => sub {
    my $student_id = param 'student_id';
    my @sheets = schema->resultset('Sheet')->search({
        student  => $student_id,
        finished => { '>' => DateTime->today->subtract(days => 30)->ymd }
    });
    my %data = map { DateTime->today->subtract(days => $_)->ymd => 0 } 0 .. 30;
    for my $sheet (@sheets) {
        $data{$sheet->finished}++;
    }
    return to_json [
        [ 'Day', 'Sheets' ],
        map [ $_, $data{$_} ], reverse sort keys %data
    ];
};

post '/foo' => sub { info 'post foo'; info params->{id}; 1;};
get  '/foo' => sub { info 'get /foo'; template 'foo' };
get '/uidesign'      => sub { template 'uidesign' };
get '/uidesign/:num' => sub { template 'uidesign_' . param 'num' };

sub past_week  { past_sheets(7 ) }
sub past_month { past_sheets(30) }

sub send_progress_email {
    my %args = @_;
    my $student = $args{student};
    my $sheet_id = $args{sheet_id};
    my $student_id = $student->id;
    my $name = $student->name;
    my $past_week = past_week();
    my $past_month = past_month();
    my $subject = "MathSheets: $name completed sheet $sheet_id"
        . " ($past_week/7 $past_month/30)";
    my $body = template progress_email => {
        name       => $name,
        sheet_id   => $sheet_id,
        past_week  => $past_week,
        past_month => $past_month,
        sheet_url  => uri_for("/students/$student_id/sheets/$sheet_id"),
    }, { layout => undef };
    my $to = $student->teacher->email;
    send_email(to => $to, subject => $subject, body => $body);
};

sub send_special_msg_email {
    my %args = @_;
    my $student = $args{student};
    my $sheet_id = $args{sheet_id};
    my $msg = $args{msg};
    my $student_id = $student->id;
    my $name = $student->name;
    my $subject = "MathSheets: special message for $name from sheet #$sheet_id";
    my $body = template special_msg_email => {
        name     => $name,
        sheet_id => $sheet_id,
        msg      => $msg,
    }, { layout => undef };
    my $to = $student->teacher->email;
    send_email(to => $to, subject => $subject, body => $body);
}

sub send_email {
    my %args = (@_, from => 'notifications@mathsheets.org');
    eval {
        email \%args;
        debug "Sent email $args{subject}";
    };
    error "Could not send email: $@" if $@;
}

1;
