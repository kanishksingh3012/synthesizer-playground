"""Transparent renders of HEX-16 for the link-preview cards: hero angle (wider) + top view.
  SPP=96 python blender/render_card.py docs/brand   (~10 min on 4 CPUs)"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
import build_hex16 as bb
c = bb.c
out = sys.argv[-1]
top, hero = bb.build()
s = bpy.context.scene
s.render.film_transparent = True
s.render.image_settings.color_mode = 'RGBA'
bpy.data.objects['floor'].is_shadow_catcher = True
card = c.camera('cam_card', (7.2, -10.5, 6.6), (0.25, -0.1, 0.4), lens=40)
c.render(card, os.path.join(out, 'card_hero.png'), res=(1800, 1200))
c.render(top, os.path.join(out, 'card_top.png'), res=(1600, 1000))
