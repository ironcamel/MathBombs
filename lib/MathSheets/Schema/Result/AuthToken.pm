use utf8;
package MathSheets::Schema::Result::AuthToken;

# Created by DBIx::Class::Schema::Loader
# DO NOT MODIFY THE FIRST PART OF THIS FILE

=head1 NAME

MathSheets::Schema::Result::AuthToken

=cut

use strict;
use warnings;

use base 'DBIx::Class::Core';

=head1 TABLE: C<auth_token>

=cut

__PACKAGE__->table("auth_token");

=head1 ACCESSORS

=head2 id

  data_type: 'varchar'
  is_nullable: 0
  size: 100

=head2 teacher_id

  data_type: 'varchar'
  is_foreign_key: 1
  is_nullable: 0
  size: 100

=head2 token

  data_type: 'varchar'
  is_nullable: 0
  size: 500

=head2 is_deleted

  data_type: 'int'
  default_value: 0
  is_nullable: 0

=head2 created

  data_type: 'timestamp'
  is_nullable: 0

=head2 updated

  data_type: 'timestamp'
  is_nullable: 0

=cut

__PACKAGE__->add_columns(
  "id",
  { data_type => "varchar", is_nullable => 0, size => 100 },
  "teacher_id",
  { data_type => "varchar", is_foreign_key => 1, is_nullable => 0, size => 100 },
  "token",
  { data_type => "varchar", is_nullable => 0, size => 500 },
  "is_deleted",
  { data_type => "int", default_value => 0, is_nullable => 0 },
  "created",
  { data_type => "timestamp", is_nullable => 0 },
  "updated",
  { data_type => "timestamp", is_nullable => 0 },
);

=head1 PRIMARY KEY

=over 4

=item * L</id>

=back

=cut

__PACKAGE__->set_primary_key("id");

=head1 UNIQUE CONSTRAINTS

=head2 C<token_unique>

=over 4

=item * L</token>

=back

=cut

__PACKAGE__->add_unique_constraint("token_unique", ["token"]);

=head1 RELATIONS

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


# Created by DBIx::Class::Schema::Loader v0.07049 @ 2020-08-02 07:18:39
# DO NOT MODIFY THIS OR ANYTHING ABOVE! md5sum:WfI17VTmJuDt3+MUSJwxBA

__PACKAGE__->load_components(qw(TimeStamp));

__PACKAGE__->add_columns(
    '+created' => { set_on_create => 1 },
    '+updated' => { set_on_create => 1, set_on_update => 1 },
);

sub TO_JSON {
    my ($self) = @_;
    my %cols = $self->get_columns;
    return {
        %cols,
        teacher => $self->teacher,
    };
}

1;
