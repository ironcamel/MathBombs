package MathSheets::MathSkills;
use strict;
use warnings;
use v5.10;
use Devel::InnerPackage qw(list_packages);

use Exporter qw(import);
our @EXPORT_OK = qw(available_skills gen_problems build_skill);

sub gen_problems {
    my ($student) = @_;
    my $skill = build_skill($student);
    return $skill->generate_problems($student->problems_per_sheet);
}

sub build_skill {
    my ($student) = @_;
    my $type = $student->math_skill || 'Addition';
    my $class = "MathSheets::MathSkills::$type";
    return $class->new(difficulty => $student->difficulty);
}

sub available_skills {
    return [
        map $_->new(), qw(
            MathSheets::MathSkills::Addition
            MathSheets::MathSkills::Subtraction
            MathSheets::MathSkills::Multiplication
            MathSheets::MathSkills::Division
            MathSheets::MathSkills::DecimalMultiplication
            MathSheets::MathSkills::Simplification
            MathSheets::MathSkills::FractionMultiplication
            MathSheets::MathSkills::FractionDivision
            MathSheets::MathSkills::FractionAddition
        )
    ];
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


package MathSheets::MathSkills::Subtraction;
use Moose;

has name => (is => 'ro', default => 'Integer Subtraction');
with 'MathSheets::MathSkills::BaseSkill';

sub generate_problem {
    my ($self) = @_;
    my $max = 10 ** $self->difficulty;
    my $n1 = int(rand() * (int $max/2)) + int $max/2;
    my $n2 = int(rand() * (int $max/2));
    my $ans = $n1 - $n2;
    my $equation = "$n1 \\; - \\; $n2";
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


package MathSheets::MathSkills::Division;
use Moose;

has name => (is => 'ro', default => 'Integer Division');
with 'MathSheets::MathSkills::BaseSkill';

sub generate_problem {
    my ($self) = @_;
    my ($divisor_max, $quotient_max);
    given ($self->difficulty) {
        when (1) { ($divisor_max, $quotient_max) = (10, 10)    }
        when (2) { ($divisor_max, $quotient_max) = (10, 100)   }
        default  { ($divisor_max, $quotient_max) = (100, 1000) }
    }
    my $divisor =  int(rand() * $divisor_max) + 1;
    my $quotient = int(rand() * $quotient_max);
    my $dividend = $divisor * $quotient;
    my $equation;
    given (int rand() * 3) {
        when (0) { $equation = "$dividend \\; / \\; $divisor"     }
        when (1) { $equation = "$dividend \\; \\div \\; $divisor" }
        when (2) { $equation = "\\frac{$dividend}{$divisor}"      }
    }
    return question => $equation, answer => $quotient;
}


package MathSheets::MathSkills::DecimalMultiplication;
use Moose;

has name => (is => 'ro', default => 'Decimal Multiplication');
with 'MathSheets::MathSkills::BaseSkill';

sub generate_problem {
    my ($self) = @_;
    my $max = 10 ** ($self->difficulty + 2);
    my $n1 = int(rand() * $max) + 10;
    my $n2 = int(rand() * $max) + 10;
    substr($n1, int(rand() * (length($n1)-1)), 1) = '.';
    substr($n2, int(rand() * (length($n2)-1)), 1) = '.';
    my $ans = $n1 * $n2;
    my $equation = "$n1 \\; \\times \\; $n2";
    return question => $equation, answer => $ans;
}


package MathSheets::MathSkills::Simplification;
use Moose;
use Math::BigInt qw(bgcd);

has name => (is => 'ro', default => 'Fraction Simplification');
with 'MathSheets::MathSkills::BaseSkill';

sub generate_problem {
    my ($self) = @_;
    my $max = 10 ** $self->difficulty; # $max is the max gcf
    my ($n1, $n2) = (2, 4);
    while(bgcd($n1, $n2) > 1) {
        ($n1, $n2) = sort { $a <=> $b } map { int(rand() * 12) + 1 } 1 .. 2;
    }
    my $ans = "$n1/$n2";
    my $gcf = int(rand() * $max) + 1;
    $_ *= $gcf foreach $n1, $n2;
    my $equation = "\\frac{$n1}{$n2}";
    return question => $equation, answer => $ans;
}


package MathSheets::MathSkills::FractionAddition;
use Moose;
use MathSheets::Util qw(irand);
use Number::Fraction;

has name => (is => 'ro', default => 'Fraction Addition');
with 'MathSheets::MathSkills::BaseSkill';

sub generate_problem {
    my ($self) = @_;
    my ($max, $num_fractions);
    given ($self->difficulty) {
        when (1) { ($max, $num_fractions) = (12, 2) }
        when (2) { ($max, $num_fractions) = (12, 3) }
        default  { ($max, $num_fractions) = (16, 3) }
    }
    my @values = map { irand($max) + 1 } 1 .. ($num_fractions * 2);
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

package MathSheets::MathSkills::FractionMultiplication;
use Moose;
use MathSheets::Util qw(irand);
use Number::Fraction;

has name => (is => 'ro', default => 'Fraction Multiplication');
with 'MathSheets::MathSkills::BaseSkill';

sub generate_problem {
    my ($self) = @_;
    my ($max, $num_fractions);
    given ($self->difficulty) {
        when (1) { ($max, $num_fractions) = (12, 2) }
        when (2) { ($max, $num_fractions) = (12, 3) }
        default  { ($max, $num_fractions) = (16, 3) }
    }
    my @values = map { irand($max) + 1 } 1 .. ($num_fractions * 2);
    my ($x, $y) = (pop(@values), pop(@values));
    my $ans = Number::Fraction->new($x, $y);
    my $equation = "\\frac{$x}{$y}";
    while (@values) {
        ($x, $y) = (pop(@values), pop(@values));
        $ans *= Number::Fraction->new($x, $y);
        my $times = irand(2) ? '\times' : '\cdot';
        $equation .= " \\; $times \\; \\frac{$x}{$y}";
    }
    return question => $equation, answer => "$ans";
}

package MathSheets::MathSkills::FractionDivision;
use Moose;
use MathSheets::Util qw(irand);
use Number::Fraction;

has name => (is => 'ro', default => 'Fraction Division');
with 'MathSheets::MathSkills::BaseSkill';

sub generate_problem {
    my ($self) = @_;
    my ($x1,$x2,$y1,$y2) = map irand($self->difficulty * 6) + 1, 1 .. 4;
    my $ans = Number::Fraction->new($x1, $x2) / Number::Fraction->new($y1, $y2);
    my $f1 = "\\frac{$x1}{$x2}";
    my $f2 = "\\frac{$y1}{$y2}";
    my $equation = "\\frac{$x1}{$x2}";
    given (int rand() * 3) {
        when (0) { $equation = "$f1 \\; / \\; $f2"     }
        when (1) { $equation = "$f1 \\; \\div \\; $f2" }
        when (2) { $equation = "\\frac{\\;$f1\\;}{\\;$f2\\;}"      }
    }
    return question => $equation, answer => "$ans";
}

1;
