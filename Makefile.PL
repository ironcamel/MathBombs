use ExtUtils::MakeMaker;

WriteMakefile(
    NAME         => 'MathSheets',
    AUTHOR       => 'Naveed Massjouni <naveedm9@gmail.com>',
    VERSION_FROM => 'lib/MathSheets.pm',
    LICENSE      => 'perl',
    PREREQ_PM => {
        'Dancer'                     => 1.31,
        'Dancer::Plugin::DBIC'       => 0.1800,
        'Dancer::Plugin::Email'      => 0,
        'Dancer::Plugin::Passphrase' => 0,
        'Dancer::Plugin::Res'        => 0,
        'Data::UUID'                 => 0,
        'DateTime'                   => 0,
        'DBD::SQLite'                => 0,
        'DBIx::Class::TimeStamp'     => 0,
        'Email::Valid'               => 0,
        'JSON'                       => 0,
        'Number::Fraction'           => 0,
        'Plack'                      => 0,
        'Proc::Simple::Async'        => 0,
        'Try::Tiny'                  => 0,
        'YAML'                       => 0,
    },
);
