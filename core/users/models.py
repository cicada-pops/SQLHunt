from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models


class TimeStampedModel(models.Model):
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        
        
class User(TimeStampedModel):
    id = models.AutoField(primary_key=True)
    xp = models.IntegerField(default=0, validators=[MinValueValidator(0)])

    def __str__(self):
        return str(self.pk)
    
    class Meta:  # type: ignore
        managed = True
        app_label = 'users'


class Case(models.Model):
    title = models.CharField(max_length=100)
    description = models.TextField()
    short_description = models.CharField(max_length=255,default="Краткое описание отсутствует")
    required_xp = models.IntegerField(validators=[MinValueValidator(0)])
    reward_xp = models.IntegerField(validators=[MinValueValidator(0)])
    answer = models.CharField(max_length=50)

    def __str__(self):
        return f"{self.pk} - {self.title}"
    
    class Meta:
        indexes = [
            models.Index(fields=['title']),
        ]
        managed = True
        app_label = 'users'


class AvailableTable(models.Model):
    case = models.ForeignKey(Case, on_delete=models.CASCADE)
    table = models.CharField(max_length=50)

    class Meta:
        indexes = [
            models.Index(fields=['case']), 
        ]
        app_label = 'users'
        unique_together = ('case', 'table')
        managed = True
    
    def __str__(self):
        return f"{self.table} for {self.case.pk}"


class UserProgress(TimeStampedModel):
    CASE_STATUS = [
    ('не начато', 'Не начато'),
    ('в процессе', 'В процессе'),
    ('завершено', 'Завершено'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    case = models.ForeignKey(Case, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=CASE_STATUS, default='не начато')

    class Meta: # type: ignore
        indexes = [
            models.Index(fields=['case', 'status']),  
            models.Index(fields=['case', 'user']),    
            models.Index(fields=['user']),        
        ]
        app_label = 'users'
        unique_together = ('user', 'case')
        managed = True
    
    def clean(self):
        if self.user.xp < self.case.required_xp:
            raise ValidationError("Not enough experience to start this case.")
        
        if self.status not in [choice[0] for choice in self.CASE_STATUS]:
            raise ValidationError(f"Invalid status value: {self.status}")

    def __str__(self):
        return f"{self.user} - {self.case} - [{self.status}]"

    