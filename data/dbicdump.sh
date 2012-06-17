#!/bin/bash
dbicdump -o dump_directory=/home/naveed/projects/MathSheets/lib \
 -o relationship_attrs='{has_many => {cascade_copy => 1, cascade_delete => 1}}'\
 MathSheets::Schema dbi:SQLite:math.db
#-o components='[qw(InflateColumn::DateTime)]' \
