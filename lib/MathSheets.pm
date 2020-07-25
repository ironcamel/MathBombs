package MathSheets;

use strict;
our $VERSION = '0.0001';
#$ENV{DBIC_TRACE} = '1=/tmp/dbic_trace';

use MathSheets::Routes::Admin;
use MathSheets::Routes::API;
use MathSheets::Routes::Auth;
use MathSheets::Routes::Public;
use MathSheets::Routes::Students;
use MathSheets::Routes::Teachers;

1;
