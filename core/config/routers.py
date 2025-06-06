class AccountRouter:
    app_labels = {'auth', 'contenttypes', 'sessions', 'admin', 'social_django', 'account'}
    db_name = 'auth'

    def db_for_read(self, model, **hints):
        if model._meta.app_label in self.app_labels:
            return self.db_name
        return None

    def db_for_write(self, model, **hints):
        if model._meta.app_label in self.app_labels:
            return self.db_name
        return None

    def allow_relation(self, obj1, obj2, **hints):
        if (
            obj1._meta.app_label in self.app_labels or
            obj2._meta.app_label in self.app_labels
        ):
            return True
        return None

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        if app_label in self.app_labels:
            return db == self.db_name
        return None
    
    
class InvestigationsRouter:
    app_label = 'investigations'
    db_name = 'investigations'

    def db_for_read(self, model, **hints):
        if model._meta.app_label == self.app_label:
            return self.db_name
        return None

    def db_for_write(self, model, **hints):
        if model._meta.app_label == self.app_label:
            return self.db_name
        return None

    def allow_relation(self, obj1, obj2, **hints):
        if (
            obj1._meta.app_label == self.app_label or
            obj2._meta.app_label == self.app_label
        ):
            return True
        return None

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        if app_label == self.app_label:
            return db == self.db_name
        return None
  
    
class UsersRouter:
    app_label = 'users'
    db_name = 'users'

    def db_for_read(self, model, **hints):
        if model._meta.app_label == self.app_label:
            return self.db_name
        return None

    def db_for_write(self, model, **hints):
        if model._meta.app_label == self.app_label:
            return self.db_name
        return None

    def allow_relation(self, obj1, obj2, **hints):
        if (
            obj1._meta.app_label == self.app_label or
            obj2._meta.app_label == self.app_label
        ):
            return True
        return None

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        if app_label == self.app_label:
            return db == self.db_name
        return None
    
class CeleryResultsRouter:
    def db_for_read(self, model, **hints):
        if model._meta.app_label == 'django_celery_results':
            return 'celery'
        return None

    def db_for_write(self, model, **hints):
        if model._meta.app_label == 'django_celery_results':
            return 'celery'
        return None

    def allow_relation(self, obj1, obj2, **hints):
        if (
            obj1._meta.app_label == 'django_celery_results' or
            obj2._meta.app_label == 'django_celery_results'
        ):
            return True
        return None

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        if app_label == 'django_celery_results':
            return db == 'celery'
        return None
