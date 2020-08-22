package MathSheets::Routes::Public;
use Dancer ':syntax';

get '/' => sub {
    return redirect uri_for '/teacher/students' if session 'teacher';
    return template 'home';
};

get '/help' => sub { template 'help' };

1;
