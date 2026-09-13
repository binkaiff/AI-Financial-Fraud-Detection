from getpass import getpass

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.user import User


def create_admin():
    db = SessionLocal()

    try:
        print("\n=== CREATE ADMIN USER ===")

        full_name = input("Admin full name: ").strip()
        email = input("Admin email: ").strip().lower()
        password = getpass("Admin password: ")
        confirm_password = getpass("Confirm password: ")

        if len(full_name) < 2:
            print("Full name must contain at least 2 characters.")
            return

        if len(password) < 8:
            print("Password must contain at least 8 characters.")
            return

        if password != confirm_password:
            print("Passwords do not match.")
            return

        existing_user = (
            db.query(User)
            .filter(User.email == email)
            .first()
        )

        if existing_user:
            print("A user with this email already exists.")
            return

        admin = User(
            full_name=full_name,
            email=email,
            hashed_password=hash_password(password),
            role="admin",
            is_active=True,
        )

        db.add(admin)
        db.commit()
        db.refresh(admin)

        print("\nAdmin created successfully.")
        print(f"ID: {admin.id}")
        print(f"Email: {admin.email}")
        print(f"Role: {admin.role}")

    except Exception as error:
        db.rollback()
        print(f"Error creating admin: {error}")

    finally:
        db.close()


if __name__ == "__main__":
    create_admin()