# Admin Testing Guide

## ✅ Quick Test
```bash
npm run test:admin
```

## 🔑 Test Admin Credentials
- **Email**: `admin@test.com`
- **Password**: `Admin@123456`
- **Role**: `admin`

## 📋 What Gets Tested

### 1. Admin Creation ✅
- Creates an admin user via `/api/auth/create-admin`
- Validates admin setup key
- Checks for duplicate prevention

### 2. Admin Login ✅
- Tests admin authentication
- Validates JWT token generation
- Confirms admin role in response

### 3. Profile Access ✅
- Retrieves admin profile via `/api/auth/profile`
- Validates JWT verification
- Checks user data integrity

### 4. Scheduler Status ✅
- Tests admin endpoint access `/api/scheduler/status`
- Verifies scheduler state information

### 5. Access Control ✅
- Creates a regular user
- Attempts admin endpoint access
- Validates 403 Forbidden response

## 🌐 Manual Testing

### Login via Browser
1. Go to http://localhost:3000/login.html
2. Use admin credentials above
3. Should redirect to dashboard

### Test Admin Endpoints

#### Get Scheduler Status
```bash
# Login first and get token
$loginBody = @{ email = "admin@test.com"; password = "Admin@123456" } | ConvertTo-Json
$login = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $login.token

# Get scheduler status
Invoke-RestMethod -Uri "http://localhost:3000/api/scheduler/status" -Headers @{ Authorization = "Bearer $token" }
```

#### Trigger Manual Scheduler Run
```bash
Invoke-RestMethod -Uri "http://localhost:3000/api/scheduler/trigger" -Method Post -Headers @{ Authorization = "Bearer $token" }
```

## 🔒 Security Features Tested

- ✅ Admin setup key validation
- ✅ Password hashing (bcrypt)
- ✅ JWT authentication
- ✅ Role-based access control
- ✅ Admin-only endpoint protection
- ✅ Regular user restriction

## 📝 Test Results
All tests passing:
- [x] Admin creation
- [x] Admin authentication
- [x] Profile retrieval
- [x] Admin endpoint access
- [x] Access control enforcement

## ⚙️ Environment Variables
```
ADMIN_SETUP_KEY=admin-setup-2025
JWT_SECRET=your_jwt_secret_here
```

## 🔄 Re-running Tests
The test is idempotent - it handles existing admins gracefully and can be run multiple times.
