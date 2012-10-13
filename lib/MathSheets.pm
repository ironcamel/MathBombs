package MathSheets;
use Dancer ':syntax';

use v5.10;
use Dancer::Plugin::DBIC;
use Dancer::Plugin::Email;
use DateTime;
use Math::BigInt qw(bgcd);
use Math::Random::Secure qw(irand);
use Number::Fraction;
use Try::Tiny;

our $VERSION = '0.0001';

#$ENV{DBIC_TRACE} = '1=/tmp/dbic_trace';

get '/uidesign'      => sub { template 'uidesign' };
get '/uidesign/:num' => sub { template 'uidesign_' . param 'num' };

get '/' => sub {
    template users => {
        users => [
            schema->resultset('User')->search(undef, {
                '+select' => [ { max => 'sheets.id' } ],
                '+as'     => 'last_sheet',
                join      => 'sheets',
                group_by  => [ 'me.id' ],
            })
        ]
    };
};

get '/users/:user' => sub {
    my $user_id = param 'user';
    my $sheet_id = schema->resultset('Sheet')->search({user_id => $user_id})
        ->get_column('id')->max;
    redirect "/users/$user_id/sheets/$sheet_id";
};

get '/users/:user_id/sheets/:sheet_id' => sub {
    my $user_id = param 'user_id';
    debug "Sheet for $user_id";
    my $sheet_id = params->{sheet_id};
    my $user = schema->resultset('User')->find($user_id);
    if ($sheet_id > $user->last_sheet + 1) {
        return send_error "You cannot skip ahead", 404;
    }

    my $problems;
    if (my $s = $user->sheets->find({id => $sheet_id, user_id => $user->id})) {
        debug "Grabbing problems from db for sheet $sheet_id";
        my @db_problems = $s->problems->search({user_id => $user->id });
        $problems = [ map { from_json($_->json) } @db_problems ];
        for my $i ( 0 .. $#db_problems ) {
            $problems->[$i]{guess} = $db_problems[$i]->guess
        }
    } else {
        debug "Creating new problems for sheet $sheet_id";
        given ($user->id) {
            when ('leila') {
                #$problems = dec_multiplication(6, 10_000);
                #$problems = division(9, 50);
                #$problems = simplification(9, 100);
                $problems = adding_fractions(9, 12);
            } when ('ava') {
                #$problems = gen_simple_problems(6, 1000, '*');
                #$problems = subtraction(20, 1000);
                #$problems = division(9, 100, 1000);
                #$problems = simplification(6, 100);
                $problems = adding_fractions(6, 12);
            } when ('test') {
                $problems = gen_simple_problems(1, 10, '+');
                #$problems = division(12, 12, 1000);
                #$problems = adding_fractions(12, 12);
            } default {
                $problems = gen_simple_problems(9, 10, '+');
            }
        }
        my $sheet = $user->sheets->create({ id => $sheet_id });
        for my $p (@$problems) {
            $sheet->problems->create({
                id => $p->{id},
                user_id => $user->id,
                json => to_json($p)
            });
        }
    }
    template sheet => {
        name       => $user->name,
        user_id    => $user->id,
        sheet_id   => $sheet_id,
        problems   => $problems,
        past_week  => past_week(),
        past_month => past_month(),
    };
};

post '/users/:user_id/sheets/:sheet_id/problems/:id' => sub {
    my $user_id = params->{user_id};
    my $sheet_id = params->{sheet_id};
    my $id = params->{id};
    my $guess = params->{guess};
    my $problem = schema->resultset('Problem')->find({
        id       => $id,
        sheet_id => $sheet_id,
        user_id  => $user_id,
    })->update({ guess => $guess });
    return 1;
};

post '/ajax/finished_sheet' => sub {
    my $sheet_id = param 'sheet_id';
    my $user_id = param 'user_id';
    my $sheet = schema->resultset('Sheet')->find({
        id      => $sheet_id,
        user_id => $user_id,
    });
    my $user = $sheet->user;
    if ($sheet_id > $user->last_sheet) {
        $user->update({ last_sheet => $sheet_id });
    }
    my $now = DateTime->now();
    $sheet->update({ finished => $now->ymd }) unless $sheet->finished;
    send_progress_email(
        user_id    => $user_id,
        sheet_id   => $sheet_id,
        past_week  => past_week(),
        past_month => past_month(),
    );
    my $msg = config->{msgs}{$user_id}{$sheet_id};
    if ($msg) {
        send_msg_email(
            user_id  => $user_id,
            sheet_id => $sheet_id,
            msg      => $msg,
        );
    }
    return 1;
};

get '/users/:user_id/report' => sub {
    my $user_id = param 'user_id';
    my $user = schema->resultset('User')->find($user_id)
        or send_error "No such user", 404;
    template report => {
        user_id    => $user_id,
        user_name  => $user->name || $user_id,
        past_week  => past_week(),
        past_month => past_month(),
    }
};

get '/ajax/report' => sub {
    my $user_id = param 'user_id';
    my @sheets = schema->resultset('Sheet')->search({
        user_id  => $user_id,
        finished => { '>' => DateTime->today->subtract(days => 30)->ymd }
    });
    my %data = map { DateTime->today->subtract(days => $_)->ymd => 0 } 0 .. 30;
    for my $sheet (@sheets) {
        $data{$sheet->finished}++;
    }
    my @data = [ 'Day', 'Sheets' ];
    push @data, map [ $_, $data{$_} ], reverse sort keys %data;
    return to_json \@data;
};

post '/foo' => sub { info 'post foo'; info params->{id}; 1;};
get '/foo' => sub { info 'get /foo'; template 'foo' };

sub past_sheets {
    my ($days) = @_;
    my $user_id = param 'user_id';
    my $now = DateTime->now();
    return schema->resultset('Sheet')->count({
        user_id  => $user_id,
        finished => { '>' => $now->subtract(days => $days)->ymd }
    });
}
sub past_week  { past_sheets(7 ) }
sub past_month { past_sheets(30) }

sub send_progress_email {
    my %args = @_;
    info 'Sending progress email: ', \%args;
    my $sheet_id = $args{sheet_id};
    my $user_id = $args{user_id};
    my $past_week = $args{past_week};
    my $past_month = $args{past_month};
    my $subject = "MathSheets: $user_id completed sheet $sheet_id,"
        . " past week: $past_week, past month: $past_month";
    $subject = "MathSheets: " . localtime;
    my $body = join "\n",
        "$user_id completed sheet $sheet_id.",
        "past week: $past_week",
        "past month: $past_month",
        uri_for("/users/$user_id/sheets/$sheet_id");
    try {
        email { subject => $subject, body => $body };
        info 'Sent email.';
    } catch {
        error "Could not send progress email: $_";
    };
};

sub send_msg_email {
    my %args = @_;
    my $to = config->{special_msg_email} or return;
    info 'Sending msg email: ', \%args;
    my $sheet_id = $args{sheet_id};
    my $user_id = $args{user_id};
    my $user = schema->resultset('User')->find($user_id)
        or die "No such user with id $user_id";
    my $msg = $args{msg};
    my $subject = "MathSheets: message for $user_id #$sheet_id";
    my $body = "Congratulations @{[$user->name]}!!!\n\n"
        . "Math sheet #$sheet_id has a special message for you:\n\n$msg";
    try {
        email { to => $to, subject => $subject, body => $body };
        info 'Sent email.';
    } catch {
        error "Could not send msg email: $_";
    };
}

sub gen_simple_problems {
    my ($cnt, $max, $op) = @_;
    my @problems;
    for my $i (1 .. $cnt) {
        my $n1 = irand($max);
        my $n2 = irand($max);
        my $ans = $op eq '+' ? $n1 + $n2 : $n1 * $n2;
        $op = '\times' if $op eq '*';
        my $equation = "$n1 \\; $op \\; $n2";
        push @problems, { id => $i, eqn => $equation, ans => $ans };
    }
    return \@problems;
}

#10_000
sub dec_multiplication {
    my ($cnt, $max) = @_;
    my @problems;
    for my $i (1 .. $cnt) {
        my $n1 = irand($max);
        my $n2 = irand($max);
        substr($n1, irand(length($n1)-1), 1) = '.';
        substr($n2, irand(length($n2)-1), 1) = '.';
        my $ans = $n1 * $n2;
        my $equation = "$n1 \\; \\times \\; $n2";
        push @problems, { id => $i, eqn => $equation, ans => $ans };
    }
    return \@problems;
}

sub subtraction {
    my ($cnt, $max) = @_;
    my @problems;
    for my $i (1 .. $cnt) {
        my $n1 = irand(int $max/2) + int $max/2;
        my $n2 = irand(int $max/2);
        my $ans = $n1 - $n2;
        my $equation = "$n1 \\; - \\; $n2";
        push @problems, { id => $i, eqn => $equation, ans => $ans };
    }
    return \@problems;
}

# A $max of 100 makes problems like 9900 / 100 = 99
sub division {
    my ($cnt, $divisor_max, $quotient_max) = @_;
    my @problems;
    for my $i (1 .. $cnt) {
        my $divisor = irand($divisor_max) + 1;
        my $quotient = irand($quotient_max);
        my $dividend = $divisor * $quotient;
        my $equation;
        given (irand(3)) {
            when (0) { $equation = "$dividend \\; / \\; $divisor"     }
            when (1) { $equation = "$dividend \\; \\div \\; $divisor" }
            when (2) { $equation = "\\frac{$dividend}{$divisor}"      }
        }
        push @problems, { id => $i, eqn => $equation, ans => $quotient };
    }
    return \@problems;
}

# $max is the max gcf
sub simplification {
    my ($cnt, $max) = @_;
    my @problems;
    for my $i (1 .. $cnt) {
        my ($n1, $n2) = (2, 4);
        while(bgcd($n1, $n2) > 1) {
            ($n1, $n2) = sort {$a <=> $b } map { irand(12) + 1 } 1 .. 2;
        }
        my $ans = "$n1/$n2";
        my $gcf = irand($max) + 1;
        $_ *= $gcf for $n1, $n2;
        my $equation = "\\frac{$n1}{$n2}";
        push @problems, { id => $i, eqn => $equation, ans => $ans };
    }
    return \@problems;
}

sub adding_fractions {
    my ($cnt, $max) = @_;
    my @problems;
    for my $i (1 .. $cnt) {
        my ($n1, $n2, $n3, $n4) = map irand($max) + 1, 1 .. 4;
        my $ans = Number::Fraction->new($n1, $n2)
            + Number::Fraction->new($n3, $n4);
        my $equation = "\\frac{$n1}{$n2} \\; + \\; \\frac{$n3}{$n4}";
        push @problems, { id => $i, eqn => $equation, ans => "$ans" };
    }
    return \@problems;
}

true;
