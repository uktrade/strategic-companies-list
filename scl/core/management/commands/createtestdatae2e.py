from django.core.management import call_command
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import user_passes_test
from django.contrib.auth.models import Group
from django.contrib.auth import get_user_model
from django.http import JsonResponse

from scl.core.models import User, Company, CompanyAccountManager

@user_passes_test(lambda u: u.is_superuser)
def reset_e2e_test_database(request):
    """
    Resets the database for end-to-end (e2e) testing by:
    1. Flushing all existing data while preserving table structure
    2. Running the migrations and initial setup commands
    3. Creating a test superuser with the right permissions
    4. Loading fixture data for testing
    
    This endpoint is:
    - Restricted to superusers only
    - Returns the test data in a format compatible with Cypress tests
    
    WARNING: This will delete ALL data in the database. Only use for e2e testing
    """
    try:
        # Removes all data from the database preserving the tables
        call_command('flush', '--noinput')
            
        # Run the same management commands as in start-e2e.sh
        call_command('migrate')
        call_command('createinitialrevisions')
        call_command('creategroups')
        call_command('waffle_flag', 'AWS_TRANSCRIBE', '--everyone', '--create')
        
        # Create the same user that mock-sso creates
        User = get_user_model()
        user, _ = User.objects.get_or_create(username="20a0353f-a7d1-4851-9af8-1bcaff152b60")
        user.email = "local.user@businessandtrade.gov.uk"
        user.first_name = "Vyvyan"
        user.last_name = "Holland"
        user.is_active = True
        user.is_staff = True
        user.is_superuser = True
        user.groups.add(Group.objects.get(name='Basic access'))
        user.groups.add(Group.objects.get(name='Viewer access'))
        user.save()
        
        # Load the fixtures
        call_command('loaddata', 'scl/core/fixtures/e2e-fixtures.json')
        
        # Extract data from loaded fixtures for Cypress e2e testing
        extracted_data = extract_test_data()
        
        return JsonResponse({
            'status': 'success',
            'message': 'Database reset with fixture data',
            'data': extracted_data
        })
        
    except Exception as e:
        import traceback
        return JsonResponse({
            'status': 'error',
            'message': str(e),
            'traceback': traceback.format_exc()
        }, status=500)

    

def extract_test_data():
    """
    Extracts relevant test data from the database after fixtures are loaded.
    """
    # Get the companies from the fixtures
    companies = {}
    for company in Company.objects.select_related().all():
        company_key = company.name.replace(' ', '')
        companies[company_key] = {
            'id': str(company.id),
            'duns_number': company.duns_number,
            'name': company.name
        }
    
    # Get the users from the fixtures
    users = {}
    for user in User.objects.all():
        user_key = f"{user.first_name}{user.last_name}"
        users[user_key] = {
            'id': user.id,
            'email': user.email,
            'name': f"{user.first_name} {user.last_name}"
        }
    
    # Get account managers from the fixtures
    account_managers = {}
    for cam in CompanyAccountManager.objects.select_related('company', 'account_manager').all():
        company_name = cam.company.name.replace(' ', '')
        key = f"{company_name}Manager"
        account_managers[key] = {
            'id': str(cam.id),
            'company_id': str(cam.company.id),
            'company_name': cam.company.name,
            'company_duns': cam.company.duns_number,
            'manager_id': cam.account_manager.id,
            'manager_name': f"{cam.account_manager.first_name} {cam.account_manager.last_name}",
            'is_lead': cam.is_lead
        }
    
    return {
        'companies': companies,
        'users': users,
        'accountManagers': account_managers
        }