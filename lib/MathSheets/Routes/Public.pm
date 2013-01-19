package MathSheets::Routes::Public;
use Dancer ':syntax';

use Dancer::Plugin::DBIC qw(schema);
use Dancer::Plugin::Res;

get '/help' => sub { template 'help' };

1;
