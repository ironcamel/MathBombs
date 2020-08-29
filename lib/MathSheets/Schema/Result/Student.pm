use utf8;
package MathSheets::Schema::Result::Student;

# Created by DBIx::Class::Schema::Loader
# DO NOT MODIFY THE FIRST PART OF THIS FILE

=head1 NAME

MathSheets::Schema::Result::Student

=cut

use strict;
use warnings;

use base 'DBIx::Class::Core';

=head1 TABLE: C<student>

=cut

__PACKAGE__->table("student");

=head1 ACCESSORS

=head2 id

  data_type: 'varchar'
  is_nullable: 0
  size: 100

=head2 name

  data_type: 'varchar'
  is_nullable: 0
  size: 100

=head2 last_sheet

  data_type: 'int'
  default_value: 0
  is_nullable: 0

=head2 teacher_id

  data_type: 'varchar'
  is_foreign_key: 1
  is_nullable: 0
  size: 100

=head2 math_skill

  data_type: 'varchar'
  is_nullable: 0
  size: 200

=head2 difficulty

  data_type: 'int'
  default_value: 1
  is_nullable: 0

=head2 problems_per_sheet

  data_type: 'int'
  default_value: 10
  is_nullable: 0

=head2 password

  data_type: 'varchar'
  is_nullable: 1
  size: 100

=head2 created

  data_type: 'timestamp'
  is_nullable: 1

=head2 updated

  data_type: 'timestamp'
  is_nullable: 1

=cut

__PACKAGE__->add_columns(
  "id",
  { data_type => "varchar", is_nullable => 0, size => 100 },
  "name",
  { data_type => "varchar", is_nullable => 0, size => 100 },
  "last_sheet",
  { data_type => "int", default_value => 0, is_nullable => 0 },
  "teacher_id",
  { data_type => "varchar", is_foreign_key => 1, is_nullable => 0, size => 100 },
  "math_skill",
  { data_type => "varchar", is_nullable => 0, size => 200 },
  "difficulty",
  { data_type => "int", default_value => 1, is_nullable => 0 },
  "problems_per_sheet",
  { data_type => "int", default_value => 10, is_nullable => 0 },
  "password",
  { data_type => "varchar", is_nullable => 1, size => 100 },
  "created",
  { data_type => "timestamp", is_nullable => 1 },
  "updated",
  { data_type => "timestamp", is_nullable => 1 },
);

=head1 PRIMARY KEY

=over 4

=item * L</id>

=back

=cut

__PACKAGE__->set_primary_key("id");

=head1 RELATIONS

=head2 powerups

Type: has_many

Related object: L<MathSheets::Schema::Result::Powerup>

=cut

__PACKAGE__->has_many(
  "powerups",
  "MathSheets::Schema::Result::Powerup",
  { "foreign.student" => "self.id" },
  { cascade_copy => 1, cascade_delete => 1 },
);

=head2 rewards

Type: has_many

Related object: L<MathSheets::Schema::Result::Reward>

=cut

__PACKAGE__->has_many(
  "rewards",
  "MathSheets::Schema::Result::Reward",
  { "foreign.student_id" => "self.id" },
  { cascade_copy => 1, cascade_delete => 1 },
);

=head2 sheets

Type: has_many

Related object: L<MathSheets::Schema::Result::Sheet>

=cut

__PACKAGE__->has_many(
  "sheets",
  "MathSheets::Schema::Result::Sheet",
  { "foreign.student" => "self.id" },
  { cascade_copy => 1, cascade_delete => 1 },
);

=head2 teacher

Type: belongs_to

Related object: L<MathSheets::Schema::Result::Teacher>

=cut

__PACKAGE__->belongs_to(
  "teacher",
  "MathSheets::Schema::Result::Teacher",
  { id => "teacher_id" },
  { is_deferrable => 0, on_delete => "CASCADE", on_update => "CASCADE" },
);


# Created by DBIx::Class::Schema::Loader v0.07049 @ 2020-08-29 03:05:02
# DO NOT MODIFY THIS OR ANYTHING ABOVE! md5sum:ppLITiQIBjd0Ux6dkXKKNg

use MathSheets::Util qw(past_sheets);

__PACKAGE__->load_components(qw(TimeStamp));

__PACKAGE__->add_columns(
    '+created' => { set_on_create => 1 },
    '+updated' => { set_on_create => 1, set_on_update => 1 },
);

sub TO_JSON {
    my ($self) = @_;
    my %cols = (
        $self->get_columns,
        past_week  => past_sheets(7, $self->id),
        past_month => past_sheets(30, $self->id),
        powerups   => { map { $_->id => $_ } $self->powerups->all },
    );
    return \%cols;
}

1;
