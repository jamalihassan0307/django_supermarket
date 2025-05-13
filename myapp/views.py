from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login
from django.contrib.auth.decorators import login_required, user_passes_test, permission_required
from django.http import JsonResponse, HttpResponseForbidden
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Sum
from django.utils import timezone
from django.core.exceptions import PermissionDenied
from django.contrib import messages
from .models import User, Product, Order, OrderItem
import json

def is_admin(user):
    return user.role == 'admin'

def is_entry_operator(user):
    return user.role == 'entry_operator'

def check_permissions(request, required_permissions):
    # Entry operators have special permissions for products
    if request.user.role == 'entry_operator' and 'myapp.add_product' in required_permissions:
        return True
    
    for perm in required_permissions:
        if not request.user.has_perm(perm):
            raise PermissionDenied
    return True

def home(request):
    if request.user.is_authenticated:
        return redirect('dashboard')
    return redirect('login')

def login_view(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(username=username, password=password)
        if user is not None:
            login(request, user)
            return redirect('dashboard')
        return render(request, 'myapp/login.html', {'error': 'Invalid credentials'})
    return render(request, 'myapp/login.html')

@login_required
def profile(request):
    if request.method == 'POST':
        user = request.user
        current_password = request.POST.get('current_password')
        
        # Verify current password
        if not current_password or not user.check_password(current_password):
            messages.error(request, 'Current password is incorrect')
            return redirect('profile')
            
        # Update basic info
        user.first_name = request.POST.get('first_name')
        user.last_name = request.POST.get('last_name')
        user.email = request.POST.get('email')
        
        # Update password if provided
        new_password = request.POST.get('new_password')
        confirm_password = request.POST.get('confirm_password')
        if new_password:
            if new_password != confirm_password:
                messages.error(request, 'New passwords do not match')
                return redirect('profile')
            user.set_password(new_password)
            
        user.save()
        messages.success(request, 'Profile updated successfully')
        
        # If password was changed, re-authenticate
        if new_password:
            user = authenticate(username=user.username, password=new_password)
            login(request, user)
            
        return redirect('profile')
        
    return render(request, 'myapp/profile.html')

@login_required
def dashboard(request):
    print("Checking user permissions...")
    can_view_orders = request.user.has_perm('myapp.view_order')
    can_view_products = request.user.has_perm('myapp.view_product')
    can_view_users = request.user.has_perm('myapp.view_user')
    can_add_order = request.user.has_perm('myapp.add_order')
    can_change_order = request.user.has_perm('myapp.change_order')
    
    context = {
        'total_revenue': Order.objects.filter(status='Paid').aggregate(Sum('total_amount'))['total_amount__sum'] or 0,
        'total_udhaar': User.objects.aggregate(Sum('udhaar'))['udhaar__sum'] or 0,
        'total_users': User.objects.count(),
        'unpaid_users': User.objects.filter(udhaar__gt=0).count(),
        'total_products': Product.objects.count(),
        'total_orders': Order.objects.count(),
        'today_orders': Order.objects.filter(order_date=timezone.now().date(), status='Unpaid'),
        'due_users': User.objects.filter(udhaar__gt=0, due_date__isnull=False).order_by('due_date'),
        'can_view_orders': can_view_orders,
        'can_view_products': can_view_products,
        'can_view_users': can_view_users,
        'can_add_order': can_add_order,
        'can_change_order': can_change_order,
    }
    return render(request, 'myapp/dashboard.html', context)

@login_required
def products(request):
    print("Checking product permissions...")
    # Entry operators can add and view products
    can_add_product = request.user.has_perm('myapp.add_product') or request.user.role == 'entry_operator'
    can_change_product = request.user.has_perm('myapp.change_product')
    can_delete_product = request.user.has_perm('myapp.delete_product')
    
    if not (request.user.has_perm('myapp.view_product') or request.user.role == 'entry_operator'):
        return render(request, 'myapp/permission_denied.html')
        
    products = Product.objects.all()
    context = {
        'products': products,
        'can_add_product': can_add_product,
        'can_change_product': can_change_product,
        'can_delete_product': can_delete_product,
    }
    return render(request, 'myapp/products.html', context)

@login_required
def orders(request):
    print("Checking order permissions...")
    # Entry operators can add and manage orders
    can_add_order = request.user.has_perm('myapp.add_order') or request.user.role == 'entry_operator'
    can_change_order = request.user.has_perm('myapp.change_order') or request.user.role == 'entry_operator'
    can_delete_order = request.user.has_perm('myapp.delete_order')
    
    if not (request.user.has_perm('myapp.view_order') or request.user.role == 'entry_operator'):
        return render(request, 'myapp/permission_denied.html')
        
    # Get orders based on role
    if request.user.role in ['admin', 'entry_operator']:
        orders = Order.objects.all()
    else:
        orders = Order.objects.filter(user=request.user)
    
    # Get all regular users (role='user') for order creation
    users = User.objects.filter(role='user') if request.user.role in ['admin', 'entry_operator'] else []
    
    # Get all available products
    products = Product.objects.filter(stock__gt=0)
    
    context = {
        'orders': orders,
        'users': users,
        'products': products,
        'can_add_order': can_add_order,
        'can_change_order': can_change_order,
        'can_delete_order': can_delete_order,
        'is_admin_or_entry': request.user.role in ['admin', 'entry_operator']
    }
    return render(request, 'myapp/orders.html', context)

@login_required
def users(request):
    print("Checking user permissions...")
    # Allow both admin and entry operators to access users
    if not (request.user.role == 'admin' or request.user.role == 'entry_operator'):
        return render(request, 'myapp/permission_denied.html')
    
    can_add_user = True  # Both admin and entry operators can add users
    can_change_user = request.user.role == 'admin' or request.user.role == 'entry_operator'  # Allow entry operators to modify users
    can_delete_user = request.user.role == 'admin'  # Only admin can delete users
    
    # Get filter parameter
    filter_type = request.GET.get('filter', 'all')
    
    # Apply filters
    if filter_type == 'paid':
        users = User.objects.filter(udhaar=0)
    elif filter_type == 'unpaid':
        users = User.objects.filter(udhaar__gt=0)
    else:  # 'all'
        users = User.objects.all()
        users = users.filter(role='user')
    
    context = {
        'users': users,
        'can_add_user': can_add_user,
        'can_change_user': can_change_user,
        'can_delete_user': can_delete_user,
        'current_filter': filter_type,
        'total_users': users.count(),
        'paid_users': User.objects.filter(udhaar=0).count(),
        'unpaid_users': User.objects.filter(udhaar__gt=0).count(),
    }
    return render(request, 'myapp/users.html', context)

# API Views with permission checks
@login_required
@csrf_exempt
def product_list(request):
    try:
        if request.method == 'GET':
            # Entry operators can view products
            if not (request.user.has_perm('myapp.view_product') or request.user.role == 'entry_operator'):
                raise PermissionDenied
            products = Product.objects.all()
            data = [{'id': p.id, 'name': p.name, 'price': str(p.price), 'stock': p.stock} for p in products]
            return JsonResponse(data, safe=False)
        elif request.method == 'POST':
            # Entry operators can add products
            if not (request.user.has_perm('myapp.add_product') or request.user.role == 'entry_operator'):
                raise PermissionDenied
            data = json.loads(request.body)
            product = Product.objects.create(
                name=data['name'],
                price=data['price'],
                stock=data['stock']
            )
            return JsonResponse({'id': product.id, 'name': product.name, 'price': str(product.price), 'stock': product.stock})
    except PermissionDenied:
        return render(request, 'myapp/permission_denied.html')
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@login_required
@csrf_exempt
def product_detail(request, pk):
    try:
        product = get_object_or_404(Product, pk=pk)
        if request.method == 'GET':
            if not (request.user.has_perm('myapp.view_product') or request.user.role == 'entry_operator'):
                raise PermissionDenied
            data = {'id': product.id, 'name': product.name, 'price': str(product.price), 'stock': product.stock}
            return JsonResponse(data)
        elif request.method in ['PUT', 'PATCH']:
            if not (request.user.has_perm('myapp.change_product') or request.user.role == 'entry_operator'):
                raise PermissionDenied
            data = json.loads(request.body)
            if 'name' in data:
                product.name = data['name']
            if 'price' in data:
                product.price = data['price']
            if 'stock' in data:
                product.stock = data['stock']
            product.save()
            return JsonResponse({'id': product.id, 'name': product.name, 'price': str(product.price), 'stock': product.stock})
    except PermissionDenied:
        return render(request, 'myapp/permission_denied.html')
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@login_required
@csrf_exempt
def order_list(request):
    if request.method == 'GET':
        if request.user.role in ['admin', 'entry_operator']:
            orders = Order.objects.all()
        else:
            orders = Order.objects.filter(user=request.user)
        data = [{
            'id': o.id,
            'user': o.user.username,
            'total_amount': str(o.total_amount),
            'status': o.status,
            'order_date': o.order_date.strftime('%Y-%m-%d')
        } for o in orders]
        return JsonResponse(data, safe=False)
    elif request.method == 'POST':
        if not (request.user.has_perm('myapp.add_order') or request.user.role == 'entry_operator'):
            return render(request, 'myapp/permission_denied.html')
            
        try:
            data = json.loads(request.body)
            # If entry operator is creating order for another user
            if request.user.role == 'entry_operator' and 'user_id' in data:
                user = User.objects.get(id=data['user_id'])
            else:
                user = request.user
                
            order = Order.objects.create(
                user=user,
                total_amount=data['total_amount'],
                status=data['status'],
                order_date=timezone.now().date()
            )
            
            for item in data['items']:
                OrderItem.objects.create(
                    order=order,
                    product_id=item['product_id'],
                    quantity=item['quantity'],
                    price=item['price']
                )
            return JsonResponse({'id': order.id})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    return JsonResponse({'error': 'Invalid request'}, status=400)

@login_required
@csrf_exempt
def order_detail(request, pk):
    order = get_object_or_404(Order, pk=pk)
    if request.user.role != 'admin' and order.user != request.user:
        return JsonResponse({'error': 'Unauthorized'}, status=403)
    
    if request.method == 'GET':
        data = {
            'id': order.id,
            'user': order.user.username,
            'total_amount': str(order.total_amount),
            'status': order.status,
            'order_date': order.order_date.strftime('%Y-%m-%d'),
            'items': [{
                'product': item.product.name,
                'quantity': item.quantity,
                'price': str(item.price)
            } for item in order.items.all()]
        }
        return JsonResponse(data)
    return JsonResponse({'error': 'Invalid request'}, status=400)

@login_required
@csrf_exempt
def user_list(request):
    # Allow both admin and entry operators to access users
    if not (request.user.role == 'admin' or request.user.role == 'entry_operator'):
        return render(request, 'myapp/permission_denied.html')

    if request.method == 'GET':
        users = User.objects.filter(udhaar__gt=0)
        data = [{
            'id': u.id,
            'name': u.username,
            'udhaar': str(u.udhaar),
            'due_date': u.due_date.strftime('%Y-%m-%d') if u.due_date else None
        } for u in users]
        return JsonResponse(data, safe=False)
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            # Create new user with basic role
            user = User.objects.create_user(
                username=data['username'],
                email=data.get('email', ''),
                password=data['password'],
                role='user'
            )
            user.first_name = data.get('first_name', '')
            user.last_name = data.get('last_name', '')
            user.udhaar = data.get('udhaar', 0)
            
            # Handle due_date properly
            due_date = data.get('due_date')
            if due_date:
                try:
                    # Parse the date string to a datetime object
                    user.due_date = timezone.datetime.strptime(due_date, '%Y-%m-%d').date()
                except ValueError:
                    return JsonResponse({'error': 'Invalid date format. Use YYYY-MM-DD'}, status=400)
            
            user.save()
            
            return JsonResponse({
                'id': user.id,
                'name': user.username,
                'udhaar': str(user.udhaar),
                'due_date': user.due_date.strftime('%Y-%m-%d') if user.due_date else None
            })
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    return JsonResponse({'error': 'Invalid request'}, status=400)

@login_required
@csrf_exempt
def user_detail(request, pk):
    # Allow both admin and entry operators to access user details
    if not (request.user.role == 'admin' or request.user.role == 'entry_operator'):
        return render(request, 'myapp/permission_denied.html')

    user = get_object_or_404(User, pk=pk)
    if request.method == 'GET':
        data = {
            'id': user.id,
            'name': user.username,
            'udhaar': str(user.udhaar),
            'due_date': user.due_date.strftime('%Y-%m-%d') if user.due_date else None,
            'orders': [{
                'id': o.id,
                'total_amount': str(o.total_amount),
                'status': o.status,
                'order_date': o.order_date.strftime('%Y-%m-%d')
            } for o in Order.objects.filter(user=user)]
        }
        return JsonResponse(data)
    elif request.method in ['PUT', 'PATCH']:
        try:
            data = json.loads(request.body)
            
            # Update username if provided
            if 'username' in data:
                user.username = data['username']
            
            # Update udhaar if provided
            if 'udhaar' in data:
                user.udhaar = data['udhaar']
            
            # Update due_date if provided
            if 'due_date' in data:
                try:
                    user.due_date = timezone.datetime.strptime(data['due_date'], '%Y-%m-%d').date() if data['due_date'] else None
                except ValueError:
                    return JsonResponse({'error': 'Invalid date format. Use YYYY-MM-DD'}, status=400)
            
            user.save()
            return JsonResponse({
                'id': user.id,
                'name': user.username,
                'udhaar': str(user.udhaar),
                'due_date': user.due_date.strftime('%Y-%m-%d') if user.due_date else None
            })
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    return JsonResponse({'error': 'Invalid request'}, status=400)
