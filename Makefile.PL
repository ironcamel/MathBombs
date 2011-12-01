use strict;
use warnings;
use ExtUtils::MakeMaker;

WriteMakefile(
    NAME                => 'MathSheets',
    AUTHOR              => q{YOUR NAME <youremail@example.com>},
    VERSION_FROM        => 'lib/MathSheets.pm',
    ABSTRACT            => 'YOUR APPLICATION ABSTRACT',
    LICENSE             => 'perl',
    PREREQ_PM => {
        'Dancer'               => 1.3014,
        'JSON'                 => 0,
        'Math::Random::Secure' => 0,
        'YAML'                 => 0,
    },
);
