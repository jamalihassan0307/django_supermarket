from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login
from django.contrib.auth.decorators import login_required, user_passes_test, permission_required
from django.http import JsonResponse, HttpResponseForbidden
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Sum
from django.utils import timezone
from django.core.exceptions import PermissionDenied
from .models import User, Product, Order, OrderItem
import json

def is_admin(user):
    return user.role == 'admin'

def check_permissions(request, required_permissions):
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
        email = request.POST.get('email')
        password = request.POST.get('password')
        try:
            user = User.objects.get(email=email)
            if user.check_password(password):
                login(request, user)
                return redirect('dashboard')
        except User.DoesNotExist:
            pass
        return render(request, 'myapp/login.html', {'error': 'Invalid credentials'})
    return render(request, 'myapp/login.html')

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
    can_add_product = request.user.has_perm('myapp.add_product')
    can_change_product = request.user.has_perm('myapp.change_product')
    can_delete_product = request.user.has_perm('myapp.delete_product')
    
    if not request.user.has_perm('myapp.view_product'):
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
    can_add_order = request.user.has_perm('myapp.add_order')
    can_change_order = request.user.has_perm('myapp.change_order')
    can_delete_order = request.user.has_perm('myapp.delete_order')
    
    if not request.user.has_perm('myapp.view_order'):
        return render(request, 'myapp/permission_denied.html')
        
    if request.user.role == 'admin':
        orders = Order.objects.all()
    else:
        orders = Order.objects.filter(user=request.user)
    
    context = {
        'orders': orders,
        'can_add_order': can_add_order,
        'can_change_order': can_change_order,
        'can_delete_order': can_delete_order,
    }
    return render(request, 'myapp/orders.html', context)

@login_required
@user_passes_test(is_admin)
def users(request):
    print("Checking user permissions...")
    can_add_user = request.user.has_perm('myapp.add_user')
    can_change_user = request.user.has_perm('myapp.change_user')
    can_delete_user = request.user.has_perm('myapp.delete_user')
    
    if not request.user.has_perm('myapp.view_user'):
        return render(request, 'myapp/permission_denied.html')
        
    users = User.objects.filter(udhaar__gt=0)
    context = {
        'users': users,
        'can_add_user': can_add_user,
        'can_change_user': can_change_user,
        'can_delete_user': can_delete_user,
    }
    return render(request, 'myapp/users.html', context)

# API Views with permission checks
@login_required
@csrf_exempt
def product_list(request):
    try:
        if request.method == 'GET':
            check_permissions(request, ['myapp.view_product'])
            products = Product.objects.all()
            data = [{'id': p.id, 'name': p.name, 'price': str(p.price), 'stock': p.stock} for p in products]
            return JsonResponse(data, safe=False)
        elif request.method == 'POST':
            check_permissions(request, ['myapp.add_product'])
            data = json.loads(request.body)
            product = Product.objects.create(
                name=data['name'],
                price=data['price'],
                stock=data['stock']
            )
            return JsonResponse({'id': product.id, 'name': product.name, 'price': str(product.price), 'stock': product.stock})
    except PermissionDenied:
        return HttpResponseForbidden("Permission denied")

@login_required
@csrf_exempt
def product_detail(request, pk):
    try:
        product = get_object_or_404(Product, pk=pk)
        if request.method == 'GET':
            check_permissions(request, ['myapp.view_product'])
            data = {'id': product.id, 'name': product.name, 'price': str(product.price), 'stock': product.stock}
            return JsonResponse(data)
        elif request.method in ['PUT', 'PATCH']:
            check_permissions(request, ['myapp.change_product'])
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
        return HttpResponseForbidden("Permission denied")

@login_required
@csrf_exempt
def order_list(request):
    if request.method == 'GET':
        if request.user.role == 'admin':
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
        data = json.loads(request.body)
        order = Order.objects.create(
            user=request.user,
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
@user_passes_test(is_admin)
@csrf_exempt
def user_list(request):
    if request.method == 'GET':
        users = User.objects.filter(udhaar__gt=0)
        data = [{
            'id': u.id,
            'name': u.username,
            'udhaar': str(u.udhaar),
            'due_date': u.due_date.strftime('%Y-%m-%d') if u.due_date else None
        } for u in users]
        return JsonResponse(data, safe=False)
    return JsonResponse({'error': 'Invalid request'}, status=400)

@login_required
@user_passes_test(is_admin)
@csrf_exempt
def user_detail(request, pk):
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
        data = json.loads(request.body)
        if 'udhaar' in data:
            user.udhaar = data['udhaar']
        if 'due_date' in data:
            user.due_date = data['due_date']
        user.save()
        return JsonResponse({'id': user.id, 'name': user.username, 'udhaar': str(user.udhaar), 'due_date': user.due_date.strftime('%Y-%m-%d') if user.due_date else None})
    return JsonResponse({'error': 'Invalid request'}, status=400)
