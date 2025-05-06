from django.core.management import call_command
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import user_passes_test
from django.contrib.auth.models import Group
from django.contrib.auth import get_user_model
from django.http import JsonResponse

@user_passes_test(lambda u: u.is_superuser)
def reset_e2e_test_database(request):
    """
    Resets the database for end-to-end (e2e) testing by:
    1. Flushing all existing data while preserving table structure
    2. Running the migrations and initial setup commands
    3. Creating a test superuser with the right permissions
    4. Loading fixture data for testing
    
    This endpoint is restricted to superusers only
    
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
        
        return JsonResponse({
            'status': 'success',
            'message': 'Database reset with fixture data',
        })
        
    except Exception as e:
        import traceback
        return JsonResponse({
            'status': 'error',
            'message': str(e),
            'traceback': traceback.format_exc()
        }, status=500)

