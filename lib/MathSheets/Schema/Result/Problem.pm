use utf8;
package MathSheets::Schema::Result::Problem;

# Created by DBIx::Class::Schema::Loader
# DO NOT MODIFY THE FIRST PART OF THIS FILE

=head1 NAME

MathSheets::Schema::Result::Problem

=cut

use strict;
use warnings;

use base 'DBIx::Class::Core';

=head1 TABLE: C<problem>

=cut

__PACKAGE__->table("problem");

=head1 ACCESSORS

=head2 id

  data_type: 'int'
  is_nullable: 0

=head2 sheet_id

  data_type: 'int'
  is_foreign_key: 1
  is_nullable: 0

=head2 user_id

  data_type: 'varchar'
  is_foreign_key: 1
  is_nullable: 0
  size: 100

=head2 json

  data_type: 'text'
  is_nullable: 1

=head2 guess

  data_type: 'text'
  is_nullable: 1

=cut

__PACKAGE__->add_columns(
  "id",
  { data_type => "int", is_nullable => 0 },
  "sheet_id",
  { data_type => "int", is_foreign_key => 1, is_nullable => 0 },
  "user_id",
  { data_type => "varchar", is_foreign_key => 1, is_nullable => 0, size => 100 },
  "json",
  { data_type => "text", is_nullable => 1 },
  "guess",
  { data_type => "text", is_nullable => 1 },
);

=head1 PRIMARY KEY

=over 4

=item * L</id>

=item * L</sheet_id>

=item * L</user_id>

=back

=cut

__PACKAGE__->set_primary_key("id", "sheet_id", "user_id");

=head1 RELATIONS

=head2 sheet

Type: belongs_to

Related object: L<MathSheets::Schema::Result::Sheet>

=cut

__PACKAGE__->belongs_to(
  "sheet",
  "MathSheets::Schema::Result::Sheet",
  { id => "sheet_id", user_id => "user_id" },
  { is_deferrable => 0, on_delete => "CASCADE", on_update => "CASCADE" },
);


# Created by DBIx::Class::Schema::Loader v0.07033 @ 2012-10-07 08:40:06
# DO NOT MODIFY THIS OR ANYTHING ABOVE! md5sum:bP6yttOpkYqIOHAD7xr6wQ


# You can replace this text with custom code or comments, and it will be preserved on regeneration
1;
