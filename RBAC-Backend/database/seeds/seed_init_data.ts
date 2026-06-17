import { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  // 1. CLEAR EXISTING DATA (Reverse order of relationships to avoid foreign key locks)
  await knex("user_branches").del();
  await knex("product_categories").del();
  await knex("categories").del();
  await knex("products").del();
  await knex("users").del();
  await knex("role_permissions").del();
  await knex("permissions").del();
  await knex("branches").del();
  await knex("roles").del();

  // 2. INSERT CORE ROLES & CAPTURE IDs
  const [adminRole, managerRole] = await knex("roles")
    .insert([{ role_name: "Super_Admin" }, { role_name: "Branch_Manager" }])
    .returning("id");

  // 3. INSERT CORE PERMISSIONS & CAPTURE IDs
  const [manageUsers, manageProducts] = await knex("permissions")
    .insert([
      { permission_name: "manage_users" },
      { permission_name: "manage_products" },
    ])
    .returning("id");

  // 4. LINK ROLES TO PERMISSIONS (Role Permissions Pivot)
  await knex("role_permissions").insert([
    { role_id: adminRole.id, permission_id: manageUsers.id },
    { role_id: adminRole.id, permission_id: manageProducts.id },
    { role_id: managerRole.id, permission_id: manageProducts.id },
  ]);

  // 5. INSERT A STARTING BRANCH & CAPTURE ID
  const [mainBranch] = await knex("branches")
    .insert([{ name: "Main Headquarters", location: "New York" }])
    .returning("id");

  // 6. INSERT A SYSTEM USER LINKED TO THE SUPER ADMIN ROLE
  const [systemUser] = await knex("users")
    .insert([
      {
        name: "Admin User",
        email: "admin@rbac.com",
        password_hash: "plain_text_password_placeholder",
        role_id: adminRole.id,
      },
    ])
    .returning("id");

  // 7. ASSIGN USER TO THE MAIN BRANCH (User Branches Pivot)
  await knex("user_branches").insert([
    { user_id: systemUser.id, branch_id: mainBranch.id },
  ]);
}
