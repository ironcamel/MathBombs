use strict;
use warnings;
use ExtUtils::MakeMaker;

WriteMakefile(
    NAME                => 'MathSheets',
    AUTHOR              => 'naveedm9@gmail.com',
    VERSION_FROM        => 'lib/MathSheets.pm',
    LICENSE             => 'perl',
    PREREQ_PM => {
        'Dancer'               => 1.3014,
        'DateTime'             => 0,
        'JSON'                 => 0,
        'Math::Random::Secure' => 0,
        'Number::Fraction'     => 0,
        'Try::Tiny'            => 0,
        'YAML'                 => 0,
    },
);
