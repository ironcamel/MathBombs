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

=head2 sheet

  data_type: 'int'
  is_foreign_key: 1
  is_nullable: 0

=head2 student

  data_type: 'varchar'
  is_foreign_key: 1
  is_nullable: 0
  size: 100

=head2 question

  data_type: 'varchar'
  is_nullable: 0
  size: 1000

=head2 answer

  data_type: 'varchar'
  is_nullable: 0
  size: 100

=head2 guess

  data_type: 'varchar'
  is_nullable: 1
  size: 100

=head2 is_solved

  data_type: 'int'
  default_value: 0
  is_nullable: 0

=cut

__PACKAGE__->add_columns(
  "id",
  { data_type => "int", is_nullable => 0 },
  "sheet",
  { data_type => "int", is_foreign_key => 1, is_nullable => 0 },
  "student",
  { data_type => "varchar", is_foreign_key => 1, is_nullable => 0, size => 100 },
  "question",
  { data_type => "varchar", is_nullable => 0, size => 1000 },
  "answer",
  { data_type => "varchar", is_nullable => 0, size => 100 },
  "guess",
  { data_type => "varchar", is_nullable => 1, size => 100 },
  "is_solved",
  { data_type => "int", default_value => 0, is_nullable => 0 },
);

=head1 PRIMARY KEY

=over 4

=item * L</id>

=item * L</sheet>

=item * L</student>

=back

=cut

__PACKAGE__->set_primary_key("id", "sheet", "student");

=head1 RELATIONS

=head2 sheet

Type: belongs_to

Related object: L<MathSheets::Schema::Result::Sheet>

=cut

__PACKAGE__->belongs_to(
  "sheet",
  "MathSheets::Schema::Result::Sheet",
  { id => "sheet", student => "student" },
  { is_deferrable => 0, on_delete => "CASCADE", on_update => "CASCADE" },
);


# Created by DBIx::Class::Schema::Loader v0.07033 @ 2012-11-26 04:34:46
# DO NOT MODIFY THIS OR ANYTHING ABOVE! md5sum:S+7W/V/DZYq0YQZzf+E8ig


# You can replace this text with custom code or comments, and it will be preserved on regeneration
1;
