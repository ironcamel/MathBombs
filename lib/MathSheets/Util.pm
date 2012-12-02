package MathSheets::Util;
use Exporter qw(import);
our @EXPORT_OK = qw(past_sheets);

use Dancer ':syntax';
use Dancer::Plugin::DBIC qw(schema);
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

1;
