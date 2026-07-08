# Python Security Checklist

## Critical (HARD BLOCK)

- [ ] **No eval() or exec() with user input** - Code execution
- [ ] **No pickle with untrusted data** - Arbitrary code execution
- [ ] **No os.system() or subprocess with shell=True + user input** - Command injection
- [ ] **Secrets in environment variables** - Never hardcoded
- [ ] **No SQL string formatting** - Use parameterized queries

## High (HARD BLOCK)

- [ ] **Validate all input** - Use Pydantic or similar
- [ ] **Sanitize file paths** - Prevent path traversal
- [ ] **Use secrets module for tokens** - Not random module
- [ ] **Set secure session cookies** - httponly, secure, samesite
- [ ] **No sensitive data in logs** - Filter passwords, tokens
- [ ] **YAML safe_load only** - Never yaml.load() with untrusted data
- [ ] **Validate deserialized data** - JSON schema validation

## Medium (WARNING)

- [ ] **Dependencies audited** - pip-audit, safety
- [ ] **Python version current** - Security patches
- [ ] **Use virtual environments** - Isolate dependencies
- [ ] **Implement rate limiting** - slowapi or similar
- [ ] **Use security linter** - bandit
- [ ] **Set DEBUG=False in production** - No stack traces
- [ ] **Configure CORS properly** - Not wildcard

## Low (INFORMATIONAL)

- [ ] **Use type hints** - Better code analysis
- [ ] **Pin dependency versions** - Reproducible builds
- [ ] **Enable Python warnings** - Catch deprecations

---

## Code Examples

### Dangerous eval/exec Prevention

```python
# BAD - Remote code execution
user_input = request.args.get('expression')
result = eval(user_input)  # CRITICAL VULNERABILITY

# BAD - Dynamic code execution
code = request.form.get('code')
exec(code)  # CRITICAL VULNERABILITY

# GOOD - Use safe alternatives
import ast

def safe_eval(expression: str) -> int:
    """Safely evaluate simple math expressions."""
    # Only allow basic math operations
    allowed_nodes = {
        ast.Expression, ast.Num, ast.BinOp,
        ast.Add, ast.Sub, ast.Mult, ast.Div, ast.Pow
    }

    tree = ast.parse(expression, mode='eval')

    for node in ast.walk(tree):
        if type(node) not in allowed_nodes:
            raise ValueError(f"Unsafe operation: {type(node).__name__}")

    return eval(compile(tree, '<string>', 'eval'))

# GOOD - Use predefined operations
OPERATIONS = {
    'add': lambda a, b: a + b,
    'subtract': lambda a, b: a - b,
    'multiply': lambda a, b: a * b,
}

def calculate(operation: str, a: float, b: float) -> float:
    if operation not in OPERATIONS:
        raise ValueError("Invalid operation")
    return OPERATIONS[operation](a, b)
```

### Pickle Vulnerability

```python
# BAD - Arbitrary code execution via pickle
import pickle

data = request.get_data()
obj = pickle.loads(data)  # CRITICAL - Can execute arbitrary code

# GOOD - Use JSON for untrusted data
import json

data = request.get_json()  # Safe deserialization

# GOOD - If pickle needed, use HMAC verification
import pickle
import hmac
import hashlib

SECRET_KEY = os.environ['PICKLE_SECRET']

def safe_pickle_loads(data: bytes, signature: str) -> object:
    """Only unpickle if signature matches."""
    expected_sig = hmac.new(
        SECRET_KEY.encode(),
        data,
        hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(signature, expected_sig):
        raise ValueError("Invalid signature - data tampered")

    return pickle.loads(data)
```

### Command Injection Prevention

```python
import subprocess
import shlex

# BAD - Shell injection
filename = request.args.get('file')
os.system(f"cat {filename}")  # CRITICAL - Command injection

# BAD - shell=True with user input
subprocess.run(f"cat {filename}", shell=True)  # CRITICAL

# GOOD - Use list arguments, no shell
subprocess.run(['cat', filename], shell=False, check=True)

# GOOD - Escape if shell needed (rare)
escaped = shlex.quote(filename)
subprocess.run(f"cat {escaped}", shell=True)

# GOOD - Validate input strictly
import re

def safe_filename(filename: str) -> str:
    """Allow only alphanumeric, dash, underscore, dot."""
    if not re.match(r'^[\w\-\.]+$', filename):
        raise ValueError("Invalid filename")
    return filename
```

### SQL Injection Prevention

```python
# BAD - SQL injection
cursor.execute(f"SELECT * FROM users WHERE id = {user_id}")

# BAD - String formatting
cursor.execute("SELECT * FROM users WHERE id = %s" % user_id)

# GOOD - Parameterized query (psycopg2)
cursor.execute(
    "SELECT * FROM users WHERE id = %s",
    (user_id,)
)

# GOOD - Named parameters
cursor.execute(
    "SELECT * FROM users WHERE email = %(email)s",
    {"email": email}
)

# GOOD - SQLAlchemy ORM
from sqlalchemy.orm import Session

def get_user(db: Session, user_id: int) -> User:
    return db.query(User).filter(User.id == user_id).first()

# GOOD - SQLAlchemy with text() and bindparams
from sqlalchemy import text

stmt = text("SELECT * FROM users WHERE id = :user_id")
result = db.execute(stmt.bindparams(user_id=user_id))
```

### Input Validation with Pydantic

```python
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
import re

class UserCreate(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8)
    age: Optional[int] = Field(None, ge=0, le=150)

    @validator('username')
    def username_alphanumeric(cls, v):
        if not re.match(r'^[a-zA-Z0-9_]+$', v):
            raise ValueError('Username must be alphanumeric')
        return v

    @validator('password')
    def password_strength(cls, v):
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain uppercase')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain lowercase')
        if not re.search(r'[0-9]', v):
            raise ValueError('Password must contain number')
        return v

# Usage
from fastapi import FastAPI, HTTPException

app = FastAPI()

@app.post("/users")
async def create_user(user: UserCreate):
    # Pydantic automatically validates
    return {"message": "User created"}
```

### Path Traversal Prevention

```python
import os
from pathlib import Path

# BAD - Path traversal vulnerability
filename = request.args.get('file')
with open(f"/uploads/{filename}") as f:  # ../../../etc/passwd
    return f.read()

# GOOD - Use pathlib and resolve
UPLOAD_DIR = Path("/uploads").resolve()

def safe_read_file(filename: str) -> str:
    """Safely read file from upload directory."""
    # Resolve to absolute path
    filepath = (UPLOAD_DIR / filename).resolve()

    # Verify file is within allowed directory
    if not filepath.is_relative_to(UPLOAD_DIR):
        raise ValueError("Invalid path - attempted traversal")

    if not filepath.exists():
        raise FileNotFoundError("File not found")

    return filepath.read_text()

# GOOD - Use secure_filename from werkzeug
from werkzeug.utils import secure_filename

filename = secure_filename(request.args.get('file'))
```

### Secure Token Generation

```python
import secrets
import random

# BAD - Predictable tokens
token = random.randint(100000, 999999)  # Guessable
token = str(random.random())[2:10]  # Predictable seed

# GOOD - Cryptographically secure
token = secrets.token_hex(32)  # 64 character hex string
token = secrets.token_urlsafe(32)  # URL-safe base64
token = secrets.token_bytes(32)  # Raw bytes

# GOOD - For API keys
def generate_api_key() -> str:
    return f"sk_{secrets.token_urlsafe(32)}"

# GOOD - For OTPs
def generate_otp(length: int = 6) -> str:
    return ''.join(secrets.choice('0123456789') for _ in range(length))
```

### YAML Safe Loading

```python
import yaml

# BAD - Arbitrary code execution
data = yaml.load(untrusted_yaml)  # CRITICAL VULNERABILITY

# GOOD - Safe loader only
data = yaml.safe_load(untrusted_yaml)

# GOOD - Explicit loader
data = yaml.load(untrusted_yaml, Loader=yaml.SafeLoader)
```

### Secure Logging

```python
import logging
import re

class SensitiveDataFilter(logging.Filter):
    """Filter sensitive data from logs."""

    SENSITIVE_PATTERNS = [
        (r'password["\']?\s*[:=]\s*["\']?[^"\'}\s]+', 'password=***'),
        (r'token["\']?\s*[:=]\s*["\']?[^"\'}\s]+', 'token=***'),
        (r'api_key["\']?\s*[:=]\s*["\']?[^"\'}\s]+', 'api_key=***'),
        (r'secret["\']?\s*[:=]\s*["\']?[^"\'}\s]+', 'secret=***'),
        (r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '***@***.***'),
    ]

    def filter(self, record: logging.LogRecord) -> bool:
        message = record.getMessage()
        for pattern, replacement in self.SENSITIVE_PATTERNS:
            message = re.sub(pattern, replacement, message, flags=re.IGNORECASE)
        record.msg = message
        record.args = ()
        return True

# Configure logger
logger = logging.getLogger(__name__)
logger.addFilter(SensitiveDataFilter())
```

### FastAPI Security Configuration

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address

app = FastAPI(
    debug=False,  # Never True in production
    docs_url=None if os.environ.get('PRODUCTION') else '/docs',
    redoc_url=None if os.environ.get('PRODUCTION') else '/redoc',
)

# CORS - Specific origins only
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://myapp.com"],  # Not ["*"]
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

# Rate limiting
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.get("/api/data")
@limiter.limit("10/minute")
async def get_data(request: Request):
    return {"data": "..."}
```

## Quick Audit Commands

```bash
# Run bandit security linter
pip install bandit
bandit -r . -ll -ii

# Audit dependencies
pip install pip-audit
pip-audit

# Check for common vulnerabilities
pip install safety
safety check

# Find dangerous patterns
grep -rn "eval(" --include="*.py" .
grep -rn "exec(" --include="*.py" .
grep -rn "pickle.loads" --include="*.py" .
grep -rn "shell=True" --include="*.py" .
grep -rn "yaml.load(" --include="*.py" .
```
