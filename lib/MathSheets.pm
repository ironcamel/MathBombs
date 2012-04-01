package MathSheets;
use Dancer ':syntax';

use v5.10;
use Dancer::Plugin::DBIC;
use Math::Random::Secure qw(irand);

our $VERSION = '0.0001';

#$ENV{DBIC_TRACE} = '1=/tmp/dbic_trace';
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

get '/users/:user/sheets/:sheet_id' => sub {
    my $user_id = param 'user';
    debug "Sheet for $user_id";
    my $sheet_id = params->{sheet_id};
    my $user = schema->resultset('User')->find($user_id);
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
        if ($user->id eq 'leila') {
            #$problems = dec_multiplication(6, 10_000);
            $problems = division(9, 50)
        } elsif ($user->id eq 'ava') {
            #$problems = gen_simple_problems(6, 1000, '*');
            #$problems = subtraction(20, 1000);
            $problems = division(6, 50)
        } elsif ($user->id eq 'test') {
            $problems = division(9, 20)
        } else {
            $problems = gen_simple_problems(9, 10, '+')
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
        name     => $user->name,
        user_id  => $user->id,
        sheet_id => $sheet_id,
        problems => $problems,
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

post '/foo' => sub { debug 'post foo'; debug params->{id}; 1;};
get '/foo' => sub { template 'foo' };

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
    my ($cnt, $max) = @_;
    my @problems;
    for my $i (1 .. $cnt) {
        my $n2 = irand($max) + 1;
        my $ans = irand($max);
        my $n1 = $n2 * $ans;
        my $equation;
        given (irand(3)) {
            when (0) { $equation = "$n1 \\; / \\; $n2"     }
            when (1) { $equation = "$n1 \\; \\div \\; $n2" }
            when (2) { $equation = "\\frac{$n1}{$n2}"      }
        }
        push @problems, { id => $i, eqn => $equation, ans => $ans };
    }
    return \@problems;
}

true;
