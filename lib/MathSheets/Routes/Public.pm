package MathSheets::Routes::Public;
use Dancer ':syntax';

use Dancer::Plugin::DBIC qw(schema);
use Dancer::Plugin::Res;

get '/' => sub {
    return redirect uri_for '/teacher/students' if session 'teacher';
    return template 'welcome';
};

get '/help' => sub { template 'help' };

1;
