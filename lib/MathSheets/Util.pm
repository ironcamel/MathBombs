package MathSheets::Util;
use Exporter qw(import);
our @EXPORT_OK = qw(past_sheets get_powerups irand gen_uuid);

use Dancer ':syntax';
use Dancer::Plugin::DBIC qw(schema);
use Data::UUID;
use DateTime;

sub past_sheets {
    my ($days, $student_id) = @_;
    $student_id ||= param 'student_id';
    my $now = DateTime->now();
    return schema->resultset('Sheet')->count({
        student  => $student_id,
        finished => { '>' => $now->subtract(days => $days)->ymd }
    });
}

sub get_powerups {
    my ($student) = @_;
    return {1 => 0, 2 => 0, map { $_->id => $_->cnt } $student->powerups->all};
}

sub irand { int rand() * shift }

sub gen_uuid { Data::UUID->new->create_str }

1;
