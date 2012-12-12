#!/usr/bin/env perl
use Dancer qw(:script);
use Dancer::Plugin::DBIC qw(schema);
schema->deploy;
