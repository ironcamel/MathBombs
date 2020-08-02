use utf8;
package MathSheets::Schema::Result::Reward;

# Created by DBIx::Class::Schema::Loader
# DO NOT MODIFY THE FIRST PART OF THIS FILE

=head1 NAME

MathSheets::Schema::Result::Reward

=cut

use strict;
use warnings;

use base 'DBIx::Class::Core';

=head1 TABLE: C<reward>

=cut

__PACKAGE__->table("reward");

=head1 ACCESSORS

=head2 id

  data_type: 'varchar'
  is_nullable: 0
  size: 100

=head2 student_id

  data_type: 'varchar'
  is_foreign_key: 1
  is_nullable: 0
  size: 100

=head2 reward

  data_type: 'text'
  is_nullable: 0

=head2 is_given

  data_type: 'int'
  default_value: 0
  is_nullable: 0

=head2 sheet_id

  data_type: 'int'
  is_nullable: 1

=head2 week_goal

  data_type: 'int'
  is_nullable: 1

=head2 month_goal

  data_type: 'int'
  is_nullable: 1

=cut

__PACKAGE__->add_columns(
  "id",
  { data_type => "varchar", is_nullable => 0, size => 100 },
  "student_id",
  { data_type => "varchar", is_foreign_key => 1, is_nullable => 0, size => 100 },
  "reward",
  { data_type => "text", is_nullable => 0 },
  "is_given",
  { data_type => "int", default_value => 0, is_nullable => 0 },
  "sheet_id",
  { data_type => "int", is_nullable => 1 },
  "week_goal",
  { data_type => "int", is_nullable => 1 },
  "month_goal",
  { data_type => "int", is_nullable => 1 },
);

=head1 PRIMARY KEY

=over 4

=item * L</id>

=back

=cut

__PACKAGE__->set_primary_key("id");

=head1 RELATIONS

=head2 student

Type: belongs_to

Related object: L<MathSheets::Schema::Result::Student>

=cut

__PACKAGE__->belongs_to(
  "student",
  "MathSheets::Schema::Result::Student",
  { id => "student_id" },
  { is_deferrable => 0, on_delete => "CASCADE", on_update => "CASCADE" },
);


# Created by DBIx::Class::Schema::Loader v0.07049 @ 2019-07-19 06:13:26
# DO NOT MODIFY THIS OR ANYTHING ABOVE! md5sum:v99zJMm+d3DSYF4KJBNgog

sub TO_JSON {
    my ($self) = @_;
    return +{ $self->get_columns };
}

1;
