package MathSheets::Routes;
use Dancer ':syntax';

any qr{(.+)} => sub {
    #my ($path) = splat;
    #pass if $path =~ qr{^/api};
    #return template 'app', {}, { layout => undef };
    template 'app';
};

1;
