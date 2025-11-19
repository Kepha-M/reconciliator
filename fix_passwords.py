from sqlalchemy.orm import Session
from app.database import get_db
from app.auth.crud import get_all_users
from app.auth.utils import hash_password

def fix_all_passwords():
    db: Session = next(get_db())
    users = get_all_users(db)
    for user in users:
        user.password = hash_password(user.password[:72])  # truncate and re-hash
        db.add(user)
        print(f"Fixed password for {user.email}")
    db.commit()
    print("All passwords fixed.")

if __name__ == "__main__":
    fix_all_passwords()
