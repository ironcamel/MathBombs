package MathSheets;
use Dancer ':syntax';
use Dancer::Plugin::DBIC;
use 5.12.0;

our $VERSION = '0.1';

get '/' => sub { template 'users' };

get '/users/:user' => sub {
    my $user = params->{user};
    redirect "/users/$user/sheets/1";
};

get '/users/:user/sheets/:sheet_id' => sub {
    my $user = params->{user};
    my $sheet_id = params->{sheet_id};
    $user = schema->resultset('User')->find($user);
    my ($problems, $guesses);
    debug "user $user";
    if (my $s = $user->sheets->find({id => $sheet_id, user_id => $user->id})) {
        my @db_problems = $s->problems->search({user_id => $user->id });
        $problems = [ map { from_json($_->json) } @db_problems ];
        for my $i ( 0 .. $#db_problems ) {
            $problems->[$i]{guess} = $db_problems[$i]->guess
        }

    } else {
        $problems = $user->id eq 'leila' ? gen_multiplication_problems(9, 1000)
            : gen_addition_problems(9, 1000);
        debug $problems;
        my $sheet = $user->sheets->create({ id => $sheet_id });
        for my $p (@$problems) {
            $sheet->problems->create({
                id => $p->{id},
                user_id => $user->id,
                json => to_json($p)
            });
        }
    }
    template tmpl_for_user($user->id) => {
        name     => $user->name,
        user_id  => $user->id,
        sheet_id => $sheet_id,
        problems => $problems,
    };
};

post '/users/:user/sheets/:sheet_id/problems/:id' => sub {
    my $user = params->{user};
    my $sheet_id = params->{sheet_id};
    my $id = params->{id};
    my $guess = params->{guess};
    my $problem = schema->resultset('Problem')->find({
        id       => $id,
        sheet_id => $sheet_id,
        user_id  => $user,
    })->update({ guess => $guess });
    1;
};

post '/foo' => sub { debug 'post foo'; debug params->{id}; 1;};
get '/foo' => sub { template 'foo' };

sub tmpl_for_user {
    my ($user) = @_;
    my %templates = (
        leila => 'multiplication_sheet',
        ava   => 'addition_sheet',
    );
    return $templates{$user};
}

sub gen_multiplication_problems {
    my ($cnt, $max) = @_;
    my @problems;
    for my $i (1 .. $cnt) {
        my $n1 = int(rand $max);
        my $n2 = int(rand $max);
        my $ans = $n1 * $n2;
        push @problems, { id => $i, n1 => $n1, n2 => $n2, ans => $ans };
    }
    return \@problems;
}

sub gen_addition_problems {
    my ($cnt, $max) = @_;
    my @problems;
    for my $i (1 .. $cnt) {
        my $n1 = int(rand $max);
        my $n2 = int(rand $max);
        my $ans = $n1 + $n2;
        push @problems, { id => $i, n1 => $n1, n2 => $n2, ans => $ans };
    }
    return \@problems;
}

true;
