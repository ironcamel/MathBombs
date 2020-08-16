use utf8;
package MathSheets::Schema::Result::Teacher;

# Created by DBIx::Class::Schema::Loader
# DO NOT MODIFY THE FIRST PART OF THIS FILE

=head1 NAME

MathSheets::Schema::Result::Teacher

=cut

use strict;
use warnings;

use base 'DBIx::Class::Core';

=head1 TABLE: C<teacher>

=cut

__PACKAGE__->table("teacher");

=head1 ACCESSORS

=head2 id

  data_type: 'varchar'
  is_nullable: 0
  size: 100

=head2 name

  data_type: 'varchar'
  is_nullable: 0
  size: 100

=head2 email

  data_type: 'varchar'
  is_nullable: 0
  size: 100

=head2 pw_hash

  data_type: 'text'
  is_nullable: 1

=head2 rewards_email

  data_type: 'varchar'
  is_nullable: 1
  size: 200

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
  "email",
  { data_type => "varchar", is_nullable => 0, size => 100 },
  "pw_hash",
  { data_type => "text", is_nullable => 1 },
  "rewards_email",
  { data_type => "varchar", is_nullable => 1, size => 200 },
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

=head1 UNIQUE CONSTRAINTS

=head2 C<email_unique>

=over 4

=item * L</email>

=back

=cut

__PACKAGE__->add_unique_constraint("email_unique", ["email"]);

=head1 RELATIONS

=head2 auth_tokens

Type: has_many

Related object: L<MathSheets::Schema::Result::AuthToken>

=cut

__PACKAGE__->has_many(
  "auth_tokens",
  "MathSheets::Schema::Result::AuthToken",
  { "foreign.teacher_id" => "self.id" },
  { cascade_copy => 1, cascade_delete => 1 },
);

=head2 password_reset_tokens

Type: has_many

Related object: L<MathSheets::Schema::Result::PasswordResetToken>

=cut

__PACKAGE__->has_many(
  "password_reset_tokens",
  "MathSheets::Schema::Result::PasswordResetToken",
  { "foreign.teacher_id" => "self.id" },
  { cascade_copy => 1, cascade_delete => 1 },
);

=head2 students

Type: has_many

Related object: L<MathSheets::Schema::Result::Student>

=cut

__PACKAGE__->has_many(
  "students",
  "MathSheets::Schema::Result::Student",
  { "foreign.teacher_id" => "self.id" },
  { cascade_copy => 1, cascade_delete => 1 },
);


# Created by DBIx::Class::Schema::Loader v0.07049 @ 2020-08-16 07:32:15
# DO NOT MODIFY THIS OR ANYTHING ABOVE! md5sum:VPE7umICIClOyBn+rHOaLw

__PACKAGE__->load_components(qw(TimeStamp));

__PACKAGE__->add_columns(
    '+created' => { set_on_create => 1 },
    '+updated' => { set_on_create => 1, set_on_update => 1 },
);

sub TO_JSON {
    my ($self) = @_;
    my %cols =  $self->get_columns;
    my @keys = grep { $_ ne 'pw_hash' } keys %cols;
    return { %cols{@keys} };
}

1;
