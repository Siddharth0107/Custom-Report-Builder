from django.conf import settings

def encode_id(num):
    return settings.HASHIDS.encode(num)

def decode_id(hashid):
    decoded = settings.HASHIDS.decode(hashid)
    return decoded[0] if decoded else None
