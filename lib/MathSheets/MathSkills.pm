package MathSheets::MathSkills;
use strict;
use warnings;
use v5.10;
use Devel::InnerPackage qw(list_packages);
use Math::BigInt qw(bgcd);
use Math::Random::Secure qw(irand);
use Number::Fraction;

use Exporter qw(import);
our @EXPORT_OK = qw(available_skills gen_problems);

sub gen_problems {
    my ($type, $difficulty, $cnt) = @_;
    $difficulty ||= 1;
    $cnt ||= 10;
    my $class = "MathSheets::MathSkills::$type";
    my $skill = $class->new(difficulty => $difficulty);
    return $skill->generate_problems();
}

sub available_skills {
    return [
        map $_->new(), qw(
            MathSheets::MathSkills::Addition
            MathSheets::MathSkills::FractionAddition
            MathSheets::MathSkills::Multiplication
        )
    ];
}

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
        push @problems, { id => $i, question => $equation, answer => $ans };
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
        push @problems, { id => $i, question => $equation, answer => $ans };
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
        push @problems, { id => $i, question => $equation, answer => $quotient };
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
        push @problems, { id => $i, question => $equation, answer => $ans };
    }
    return \@problems;
}

package MathSheets::MathSkills::BaseSkill;
use Moose::Role;

requires qw(generate_problem name);

has difficulty => (is => 'ro', isa => 'Int', default => 1);

sub generate_problems {
    my ($self, $cnt) = @_;
    $cnt ||= 10;
    return [ map +{ id => $_, $self->generate_problem() }, 1 .. $cnt ];
}

# Returns the type of math skill this is by introspecting the class name.
# For an object of type MathSheets::MathSkills::Foo, it will return 'Foo'.
#
sub type {
    my ($self) = @_;
    my ($type) = $self->meta->name =~ /.+::(.+)/;
    return $type;
}

package MathSheets::MathSkills::Addition;
use Moose;

has name => (is => 'ro', default => 'Integer Addition');
with 'MathSheets::MathSkills::BaseSkill';

sub generate_problem {
    my ($self) = @_;
    my $max = 10 ** $self->difficulty;
    my $n1 = int rand() * $max;
    my $n2 = int rand() * $max;
    my $ans = $n1 + $n2;
    my $equation = "$n1 \\; + \\; $n2";
    return question => $equation, answer => $ans;
}

package MathSheets::MathSkills::Multiplication;
use Moose;

has name => (is => 'ro', default => 'Integer Multiplication');
with 'MathSheets::MathSkills::BaseSkill';

sub generate_problem {
    my ($self) = @_;
    my $max = 10 ** $self->difficulty;
    my $n1 = int rand() * $max;
    my $n2 = int rand() * $max;
    my $ans = $n1 * $n2;
    my $equation = "$n1 \\; \\times \\; $n2";
    return question => $equation, answer => $ans;
}

package MathSheets::MathSkills::FractionAddition;
use Moose;
use Number::Fraction;

has name => (is => 'ro', default => 'Fraction Addition');
with 'MathSheets::MathSkills::BaseSkill';

sub generate_problem {
    my ($self) = @_;
    my ($max, $num_fractions);
    given ($self->difficulty) {
        when (1) { ($max, $num_fractions) = (12, 2) }
        when (2) { ($max, $num_fractions) = (12, 3) }
        default  { ($max, $num_fractions) = (24, 3) }
    }
    my @values = map { int(rand() * $max) + 1 } 1 .. ($num_fractions * 2);
    my ($x, $y) = (pop(@values), pop(@values));
    my $ans = Number::Fraction->new($x, $y);
    my $equation = "\\frac{$x}{$y}";
    while (@values) {
        ($x, $y) = (pop(@values), pop(@values));
        $ans += Number::Fraction->new($x, $y);
        $equation .= " \\; + \\; \\frac{$x}{$y}";
    }
    return question => $equation, answer => "$ans";
}

1;
