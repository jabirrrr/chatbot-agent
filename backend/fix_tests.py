import os
import glob

def fix_tests():
    for filepath in glob.glob("tests/**/*.py", recursive=True):
        with open(filepath, 'r') as f:
            content = f.read()
        
        new_content = content.replace("is_superuser=True", "platform_role=\"super_user\"")
        new_content = new_content.replace("is_superuser=False", "platform_role=\"normal_user\"")
        
        if new_content != content:
            with open(filepath, 'w') as f:
                f.write(new_content)
            print(f"Fixed {filepath}")

if __name__ == '__main__':
    fix_tests()
