from pydantic import BaseModel, EmailStr, ConfigDict, Field
from datetime import datetime

class UserRegister(BaseModel):
    full_name: str
    email: EmailStr
    password: str = Field(min_length=8)
    country: str | None = None
    country_code: str | None = None
    phone_number: str | None = None
    address: str | None = None
    city: str | None = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    full_name: str
    email: EmailStr
    role: str
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"