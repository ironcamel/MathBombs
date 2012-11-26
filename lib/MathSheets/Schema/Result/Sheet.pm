use utf8;
package MathSheets::Schema::Result::Sheet;

# Created by DBIx::Class::Schema::Loader
# DO NOT MODIFY THE FIRST PART OF THIS FILE

=head1 NAME

MathSheets::Schema::Result::Sheet

=cut

use strict;
use warnings;

use base 'DBIx::Class::Core';

=head1 TABLE: C<sheet>

=cut

__PACKAGE__->table("sheet");

=head1 ACCESSORS

=head2 id

  data_type: 'int'
  is_nullable: 0

=head2 student

  data_type: 'varchar'
  is_foreign_key: 1
  is_nullable: 0
  size: 100

=head2 finished

  data_type: 'date'
  is_nullable: 1

=cut

__PACKAGE__->add_columns(
  "id",
  { data_type => "int", is_nullable => 0 },
  "student",
  { data_type => "varchar", is_foreign_key => 1, is_nullable => 0, size => 100 },
  "finished",
  { data_type => "date", is_nullable => 1 },
);

=head1 PRIMARY KEY

=over 4

=item * L</id>

=item * L</student>

=back

=cut

__PACKAGE__->set_primary_key("id", "student");

=head1 RELATIONS

=head2 problems

Type: has_many

Related object: L<MathSheets::Schema::Result::Problem>

=cut

__PACKAGE__->has_many(
  "problems",
  "MathSheets::Schema::Result::Problem",
  { "foreign.sheet" => "self.id", "foreign.student" => "self.student" },
  { cascade_copy => 1, cascade_delete => 1 },
);

=head2 student

Type: belongs_to

Related object: L<MathSheets::Schema::Result::Student>

=cut

__PACKAGE__->belongs_to(
  "student",
  "MathSheets::Schema::Result::Student",
  { id => "student" },
  { is_deferrable => 0, on_delete => "CASCADE", on_update => "CASCADE" },
);


# Created by DBIx::Class::Schema::Loader v0.07033 @ 2012-11-26 04:34:46
# DO NOT MODIFY THIS OR ANYTHING ABOVE! md5sum:DUE8JC82onaV8Bto/qUx0g


# You can replace this text with custom code or comments, and it will be preserved on regeneration
1;
